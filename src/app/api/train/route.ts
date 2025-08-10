import { NextResponse } from 'next/server'
import { trainModel } from '@/lib/markov'

export async function GET() {
  try {
    await trainModel()
    return NextResponse.json({ status: 'Modelo entrenado' })
  } catch (e) {
    return NextResponse.json({ error: 'Fallo al entrenar' }, { status: 500 })
  }
}
