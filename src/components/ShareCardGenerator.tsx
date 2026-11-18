'use client'
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { Region, Snapshot } from '@/lib/types'

export function ShareCardGenerator({ regions, snapshot }: { regions: Region[]; snapshot: Snapshot }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const rows = regions
    .map((r) => ({ r, s: snapshot.stats.find((x) => x.regionId === r.id) }))
    .filter((x) => x.s)
    .sort((a, b) => (b.s!.activistsCount - a.s!.activistsCount))

  const top5 = rows.slice(0, 5)
  const total = snapshot.stats.reduce((a, s) => a + s.activistsCount, 0)
  const best = [...rows].sort((a, b) => b.s!.deltaActivists - a.s!.deltaActivists)[0]
  const inGoal = rows.filter((x) => x.s!.activistsCount >= x.r.minThreshold).length

  const download = async () => {
    if (!ref.current) return
    setBusy(true)
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#241814' })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `gonka-regionov-${new Date(snapshot.createdAt).toISOString().slice(0,10)}.png`
      a.click()
    } finally {
      setBusy(false)
    }
  }

  const copyText = async () => {
    const lines = [
      `🏕 Гонка регионов — обновление (${new Date(snapshot.createdAt).toLocaleString('ru-RU')})`,
      `👥 Новеньких привлечено: ${total}`,
      `🎯 Регионов в цели: ${inGoal}/7`,
      `🏆 Главный приз — кэмп для региона-победителя`,
      best ? `🚀 Прорыв: ${best.r.name} (+${best.s!.deltaActivists})` : '',
      '',
      'Топ-5 регионов:',
      ...top5.map((r, i) => `${i + 1}. ${r.r.name} — ${r.s!.activistsCount} новичков (${r.s!.deltaActivists >= 0 ? '+' : ''}${r.s!.deltaActivists}) · ${Math.min(100, Math.round((r.s!.activistsCount / r.r.minThreshold)*100))}% порога`),
    ].filter(Boolean)
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="share" className="section-wrap mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="rounded-[1.75rem] border border-[#e7e1d8] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#1d6f42]">Шеринг</div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#241814]">Медиа-отчёт для чата БК</h2>
            <p className="mt-1 text-sm text-[#6b625c]">Готовая карточка (PNG) и текстовая сводка: новички, которых привлекли кампусы</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyText} className="rounded-full border border-[#e7e1d8] bg-white px-4 py-2.5 text-sm font-bold text-[#3b2a22] transition hover:-translate-y-0.5 hover:bg-[#f4efe9]">{copied ? '✓ Скопировано' : 'Скопировать текст'}</button>
            <button onClick={download} disabled={busy} className="rounded-full bg-[#1d6f42] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1d6f42]/20 transition hover:-translate-y-0.5 hover:bg-[#185c37] disabled:opacity-60">{busy ? 'Генерация…' : 'Скачать PNG'}</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#e7e1d8] bg-[#f8f6f3] p-2 sm:p-3 [-webkit-overflow-scrolling:touch]">
          <div className="mb-2 px-1 text-xs font-medium text-[#6b625c] sm:hidden">Листайте вправо для просмотра полной карточки →</div>
          <div ref={ref} className="relative w-[760px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#241814] via-[#3b2a22] to-[#1d6f42] p-8 text-white">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#1d6f42]/25 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              <div className="mb-5 flex items-start justify-between gap-6">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90">Жаңа адамдар · гонка регионов</div>
                  <h3 className="text-[2rem] font-extrabold leading-[1.05] tracking-tight">Рейтинг регионов<br /><span className="text-[#a7e3bf]">по новеньким</span></h3>
                  <div className="mt-2 text-sm font-semibold text-white/85">🏕 Главный приз — кэмп для региона-победителя</div>
                </div>
                <div className="grid gap-2 text-right">
                  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Новичков</div>
                    <div className="text-3xl font-extrabold text-[#a7e3bf]">{total.toLocaleString('ru-RU')}</div>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/90">В цели: {inGoal}/7 регионов</div>
                </div>
              </div>

              <div className="mb-5 grid gap-2.5">
                {top5.map((r, i) => {
                  const pct = Math.min(100, Math.round((r.s!.activistsCount / r.r.minThreshold) * 100))
                  return (
                    <div key={r.r.id} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${i === 0 ? 'border border-[#a7e3bf]/40 bg-[#1d6f42]/30' : 'bg-white/10'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-extrabold ${i===0?'bg-[#a7e3bf] text-[#241814]':'bg-white/15 text-white'}`}>{i + 1}</span>
                        <div>
                          <div className="font-bold">{r.r.name}</div>
                          <div className="text-[11px] text-white/75">{pct}% порога · {r.s!.deltaActivists >= 0 ? '+' : ''}{r.s!.deltaActivists} за период</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold">{r.s!.activistsCount.toLocaleString('ru-RU')}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4 text-sm text-white/80">
                <span>🚀 Прорыв: <b className="text-white">{best ? `${best.r.name} (+${best.s!.deltaActivists})` : '—'}</b></span>
                <span>Обновлено: {new Date(snapshot.createdAt).toLocaleString('ru-RU')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
