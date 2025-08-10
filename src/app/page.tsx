"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [seed, setSeed] = useState("");
  const [length, setLength] = useState(50);
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/generate?length=${length}&seed=${encodeURIComponent(seed)}`
      );
      const json = await res.json();
      setGenerated(json.text);
    } catch (err) {
      console.error(err);
      setGenerated("Error generando texto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 gap-16">
      <main className="row-start-2 flex flex-col items-center gap-8">
        {/* <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        /> */}

        <div className="w-full max-w-lg p-6 bg-white/80 dark:bg-black/80 rounded-lg shadow-md">
          <h2 className="mb-4 text-lg font-semibold">Prueba Generación Markov</h2>
          <label className="block mb-2">
            Semilla:
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Escribe aquí…"
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
          <label className="block mb-4">
            Longitud (palabras):
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value, 10) || 0)}
              min={1}
              max={500}
              className="w-24 mt-1 p-2 border rounded"
            />
          </label>
          <button
            onClick={onGenerate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Generando…" : "Generar Texto"}
          </button>

          {generated !== null && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded whitespace-pre-wrap">
              {generated}
            </div>
          )}
        </div>
      </main>
      {/* footer… */}
    </div>
  );
}
