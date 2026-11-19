'use client'

import { useState } from 'react'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!password || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError(res.status === 401 ? 'Неверный пароль' : 'Ошибка сервера. Попробуйте ещё раз.')
        return
      }
      window.location.reload()
    } catch {
      setError('Не удалось связаться с сервером')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf7fd] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#e9e0f2] bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-extrabold text-[#320066]">Вход в админку</h1>
        <p className="mb-4 text-sm text-[#6b6472]">Доступ только для команды проекта.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
          placeholder="Пароль"
          autoComplete="current-password"
          className="mb-3 w-full rounded-xl border border-[#e9e0f2] px-3.5 py-2.5 outline-none focus:border-[#ffa400]/50 focus:ring-4 focus:ring-[#ffa400]/10"
        />
        {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}
        <button
          onClick={() => void submit()}
          disabled={busy}
          className="w-full rounded-full bg-[#4c008e] px-4 py-2.5 font-semibold text-white transition hover:bg-[#320066] disabled:opacity-60"
        >
          {busy ? 'Проверка…' : 'Войти'}
        </button>
        <a href="/camp2026" className="mt-3 block text-center text-sm font-medium text-[#ffa400] hover:underline">
          ← К дашборду
        </a>
      </div>
    </main>
  )
}
