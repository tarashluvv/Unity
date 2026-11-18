import type { Region, RegionStats } from '@/lib/types'

export function GoalProgress({ regions, stats }: { regions: Region[]; stats: RegionStats[] }) {
  const items = regions.map((r) => {
    const s = stats.find((x) => x.regionId === r.id)
    const v = s?.activistsCount || 0
    const pctRaw = Math.round((v / Math.max(1, r.minThreshold)) * 100)
    const pct = Math.min(100, pctRaw)
    const ok = v >= r.minThreshold
    return { r, v, pct, pctRaw, ok }
  })
  const done = items.filter((i) => i.ok).length
  const totalPct = Math.round(items.reduce((a, i) => a + i.pct, 0) / Math.max(1, items.length))
  const totalActivists = items.reduce((a, i) => a + i.v, 0)
  const totalTarget = items.reduce((a, i) => a + i.r.minThreshold, 0)
  const radius = 44
  const circ = 2 * Math.PI * radius
  const dash = (totalPct / 100) * circ

  return (
    <section id="goal" className="section-wrap mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-[#e7e1d8] bg-white p-5 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#1d6f42]/8 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[#3b2a22]/5 blur-3xl" />

        <div className="relative mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative mx-auto grid h-[96px] w-[96px] shrink-0 place-items-center sm:mx-0 sm:h-[112px] sm:w-[112px]">
              <svg width="112" height="112" viewBox="0 0 112 112" className="h-full w-full -rotate-90">
                <circle cx="56" cy="56" r={radius} stroke="#ede7df" strokeWidth="10" fill="none" />
                <circle cx="56" cy="56" r={radius} stroke="url(#goalGrad)" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} className="transition-all duration-1000" />
                <defs>
                  <linearGradient id="goalGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b2a22" />
                    <stop offset="100%" stopColor="#1d6f42" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-1 grid place-items-center text-center">
                <div className="text-xl font-extrabold text-[#1d6f42] sm:text-2xl">{totalPct}%</div>
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[#e7f4ec] px-3 py-1 text-xs font-bold text-[#1d6f42] ring-1 ring-[#1d6f42]/15">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#1d6f42]" /> Гонка за новеньких
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-[#241814] sm:text-[1.7rem]">Прогресс к цели конкурса</h2>
              <p className="mt-1 max-w-xl text-sm text-[#6b625c]">Индикатор выполнения порогов по 7 регионам. {totalActivists.toLocaleString('ru-RU')} новичков из {totalTarget.toLocaleString('ru-RU')} целевых.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <div className="rounded-2xl border border-[#e7e1d8] bg-[#f8f6f3] px-4 py-3 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6b625c]">В цели</div>
              <div className="text-xl font-extrabold text-[#1d6f42]">{done}<span className="text-[#a89b90]">/{items.length}</span></div>
            </div>
            <div className="rounded-2xl border border-[#3b2a22]/15 bg-[#f4efe9] px-4 py-3 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6b4f3a]">Осталось регионов</div>
              <div className="text-xl font-extrabold text-[#3b2a22]">{items.length - done}</div>
            </div>
          </div>
        </div>

        <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((i, idx) => (
            <div
              key={i.r.id}
              className={`group relative overflow-hidden rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 hover:shadow-md ${i.ok ? 'border-[#1d6f42]/25 bg-gradient-to-br from-[#e7f4ec] to-white' : 'border-[#e7e1d8] bg-white'}`}
              style={{ animation: `rise .55s cubic-bezier(.2,.8,.2,1) ${idx * 45}ms both` }}
            >
              {i.ok && <div className="absolute right-3 top-3 rounded-full bg-[#1d6f42] px-2 py-0.5 text-[10px] font-bold text-white shadow">ГОТОВО</div>}
              <div className="mb-2 pr-14">
                <div className="font-bold text-[#241814]">{i.r.name}</div>
                <div className="text-xs text-[#6b625c]">порог {i.r.minThreshold.toLocaleString('ru-RU')}</div>
              </div>
              <div className="mb-2 flex items-end justify-between">
                <div className="text-2xl font-extrabold text-[#3b2a22]">{i.v.toLocaleString('ru-RU')}</div>
                <div className={`text-sm font-bold ${i.ok ? 'text-[#1d6f42]' : 'text-[#6b625c]'}`}>{i.pctRaw}%</div>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-[#efe9e1]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${i.ok ? 'bg-gradient-to-r from-[#2e8b57] to-[#1d6f42]' : 'bg-gradient-to-r from-[#6b4f3a] to-[#1d6f42]'}`}
                  style={{ width: `${i.pct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-[#6b625c]">{i.ok ? `+${(i.v - i.r.minThreshold).toLocaleString('ru-RU')} сверх порога` : `ещё ${(i.r.minThreshold - i.v).toLocaleString('ru-RU')} до цели`}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
