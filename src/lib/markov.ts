import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const CORPUS_DIR = process.env.CORPUS_DIR || path.resolve(process.cwd(), 'corpus');
const N = parseInt(process.env.MARKOV_N || '3', 10);
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('La variable DATABASE_URL no está definida');
}

const pool = new Pool({ connectionString: DATABASE_URL });
const TABLE = 'transiciones_markov';

function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map(w => w.replace(/[\"\(\)\[\],.!?;:\-]/g, '').toLowerCase())
    .filter(Boolean);
}

function sampleNext(entries: [string, number][]): string | null {
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  let r = Math.random() * total;
  for (const [word, count] of entries) {
    r -= count;
    if (r <= 0) return word;
  }
  return null;
}

// entrena el modelo leyendo .txt desde CORPUS_DIR y llenando la tabla de transiciones en la BD
export async function trainModel(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`TRUNCATE TABLE ${TABLE}`);

    const files = fs.readdirSync(CORPUS_DIR).filter(f => f.endsWith('.txt'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(CORPUS_DIR, file), 'utf-8');
      const tokens = tokenize(content);
      for (let i = 0; i <= tokens.length - N; i++) {
        const prefix = tokens.slice(i, i + N - 1).join(' ');
        const next = tokens[i + N - 1];
        await client.query(
          `INSERT INTO ${TABLE} (prefijo, siguiente_token, frecuencia)
           VALUES ($1, $2, 1)
           ON CONFLICT (prefijo, siguiente_token)
           DO UPDATE SET frecuencia = ${TABLE}.frecuencia + 1`,
          [prefix, next]
        );
      }
    }
    console.log(`Modelo entrenado en PostgreSQL (n=${N}) con ${files.length} archivos.`);
  } finally {
    client.release();
  }
}

// genera texto de hasta maxWords palabras o con semilla opcional
export async function generateText(maxWords = 50, seed?: string): Promise<string> {
  let state: string[];
  if (seed) {
    const seedTokens = tokenize(seed);
    state = seedTokens.slice(-(N - 1));
    while (state.length < N - 1) state.unshift('');
  } else {
    const res = await pool.query(
      `SELECT prefijo FROM ${TABLE} ORDER BY RANDOM() LIMIT 1`
    );
    if (res.rows.length === 0) {
      throw new Error('Modelo no entrenado o base de datos vacía');
    }
    state = res.rows[0].prefijo.split(' ');
  }

  const result: string[] = [];
  for (let i = 0; i < maxWords; i++) {
    const prefixKey = state.join(' ');
    const res = await pool.query(
      `SELECT siguiente_token, frecuencia
       FROM ${TABLE}
       WHERE prefijo = $1`,
      [prefixKey]
    );
    if (res.rows.length === 0) break;
    const entries: [string, number][] = res.rows.map(row => [row.siguiente_token, Number(row.frecuencia)]);
    const next = sampleNext(entries);
    if (!next) break;
    result.push(next);
    state = [...state.slice(1), next];
  }

  return result.join(' ');
}
