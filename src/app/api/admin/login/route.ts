import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, checkPassword, createSessionToken } from '@/lib/admin-auth'

export async function POST(request: Request) {
  let password: unknown
  try {
    const body = await request.json()
    password = body?.password
  } catch {
    return NextResponse.json({ error: 'Неверный запрос' }, { status: 400 })
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(8 * 60 * 60),
  })
  return response
}
