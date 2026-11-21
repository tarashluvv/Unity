import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { normalizeState } from '@/lib/data'
import { readState, sanitizeStateForPublic, writeState } from '@/lib/state-server'
import type { AppState } from '@/lib/types'

export async function GET() {
  const state = await readState()
  const authed = await isAdminAuthed()
  return NextResponse.json(authed ? state : sanitizeStateForPublic(state), {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Неверный запрос' }, { status: 400 })
  }
  const parsed = body as AppState
  if (!parsed || !Array.isArray(parsed.regions) || !Array.isArray(parsed.snapshots)) {
    return NextResponse.json({ error: 'Неверный формат состояния' }, { status: 400 })
  }
  const normalized = normalizeState(parsed)
  await writeState(normalized)
  return NextResponse.json({ ok: true })
}
