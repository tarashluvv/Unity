import type { Snapshot } from '@/lib/types'

export function SnapshotTimeline({ snapshots }: { snapshots: Snapshot[] }) {
  const recent = snapshots.slice(-5)
  const totals = recent.map((s) => s.stats.reduce((a, x) => a + x.activistsCount, 0))
  const max = Math.max(1, ...totals)
  const min = Math.min(...totals, 0)
  const range = Math.max(1, max - min)

  return (
    <section id="timeline" className="section-wrap mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-[#e7e1d8] bg-white p-5 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#f8f6f3] to-transparent" />
        <div className="relative mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#1d6f42]/80">Динамика</div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#241814]">История обновлений</h2>
            <p className="mt-1 text-sm text-[#6b625c]">Рост привлечённых новичков по опубликованным срезам</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[#e7e1d8] bg-[#f8f6f3] px-4 py-2">
            <span className="text-sm font-semibold text-[#6b4f3a]">Итераций:</span>
            <span className="text-xl font-extrabold text-[#3b2a22]">{snapshots.length}</span>
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="pointer-events-none absolute left-[10%] right-[10%] top-[52%] hidden h-px bg-gradient-to-r from-transparent via-[#e7e1d8] to-transparent lg:block" />
          {recent.map((s, i) => {
            const total = totals[i]
            const h = 18 + ((total - min) / range) * 82
            const prev = i > 0 ? totals[i - 1] : total
            const delta = total - prev
            const active = i === recent.length - 1
            return (
              <div
                key={s.id}
                className={`group relative flex flex-col rounded-2xl border p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${active ? 'border-[#1d6f42]/30 bg-gradient-to-b from-[#e7f4ec] to-white shadow-sm ring-1 ring-[#1d6f42]/10' : 'border-[#e7e1d8] bg-white'}`}
                style={{ animation: `rise .5s cubic-bezier(.2,.8,.2,1) ${i * 70}ms both` }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4efe9] text-xs font-extrabold text-[#3b2a22]">{i + 1}</div>
                  {active && <span className="rounded-full bg-[#1d6f42] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">сейчас</span>}
                </div>
                <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9b8f85]">{new Date(s.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-2xl font-extrabold tracking-tight text-[#241814]">{total.toLocaleString('ru-RU')}</div>
                <div className={`mb-3 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${delta > 0 ? 'bg-[#e7f4ec] text-[#1d6f42]' : delta < 0 ? 'bg-rose-50 text-rose-700' : 'bg-[#f4efe9] text-[#6b625c]'}`}>
                  {i === 0 ? 'базовый срез' : `${delta >= 0 ? '↑ +' : '↓ '}${delta.toLocaleString('ru-RU')}`}
                </div>
                <div className="mt-auto flex h-24 items-end rounded-xl bg-gradient-to-t from-[#f8f6f3] to-transparent p-1.5">
                  <div
                    className={`relative w-full overflow-hidden rounded-lg transition-all duration-700 ${active ? 'bg-gradient-to-t from-[#3b2a22] via-[#1d6f42] to-[#2e8b57]' : 'bg-gradient-to-t from-[#6b4f3a] to-[#1d6f42] opacity-75 group-hover:opacity-100'}`}
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-white/15" />
                  </div>
                </div>
                <div className="mt-2 line-clamp-2 min-h-[2.2em] text-[11px] leading-snug text-[#6b625c]">{s.comment}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
