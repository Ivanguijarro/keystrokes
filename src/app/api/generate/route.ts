import { NextResponse } from 'next/server'
import { generateText } from '@/lib/markov'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const length = parseInt(searchParams.get('length') ?? '50')
  const seed   = searchParams.get('seed') || undefined

  try {
    const text = await generateText(length, seed)
    return NextResponse.json({ text })
  } catch (e) {
    return NextResponse.json({ error: 'Fallo al generar' }, { status: 500 })
  }
}
