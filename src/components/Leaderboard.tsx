'use client'
import { useMemo, useState } from 'react'
import type { Region, RegionStats, Snapshot } from '@/lib/types'

function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values)
  const min = Math.min(...values)
  const range = Math.max(1, max - min)
  const w = 88, h = 30
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 6) - 3
    return `${x},${y}`
  }).join(' ')
  const area = `0,${h} ${pts} ${w},${h}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffa400" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffa400" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#sparkFill)" points={area} />
      <polyline fill="none" stroke="#ffa400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {values.map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * w
        const y = h - ((v - min) / range) * (h - 6) - 3
        return <circle key={i} cx={x} cy={y} r={i === values.length - 1 ? 3.5 : 2} fill={i === values.length - 1 ? '#4c008e' : '#ffb52e'} stroke="white" strokeWidth="1" />
      })}
    </svg>
  )
}

export function Leaderboard({
  regions,
  stats,
  snapshots,
  onSelectRegion,
}: {
  regions: Region[]
  stats: RegionStats[]
  snapshots: Snapshot[]
  onSelectRegion: (id: string) => void
}) {
  const [q, setQ] = useState('')
  const rows = useMemo(() => {
    const merged = regions.map((r) => {
      const s = stats.find((x) => x.regionId === r.id)
      const conv = s && s.fgCount > 0 ? s.activistsCount / s.fgCount : 0
      const thresholdPctRaw = s ? Math.round((s.activistsCount / r.minThreshold) * 100) : 0
      const thresholdPct = Math.min(100, thresholdPctRaw)
      const thresholdOk = s ? s.activistsCount >= r.minThreshold : false
      const trend = snapshots.slice(-5).map((sn) => sn.stats.find((x) => x.regionId === r.id)?.activistsCount || 0)
      return { region: r, stats: s, conv, thresholdPct, thresholdPctRaw, thresholdOk, trend }
    }).filter((x) => !q || x.region.name.toLowerCase().includes(q.toLowerCase()) || x.region.cities.some(c => c.toLowerCase().includes(q.toLowerCase())))
    merged.sort((a, b) => (b.stats?.activistsCount || 0) - (a.stats?.activistsCount || 0))
    return merged
  }, [regions, stats, snapshots, q])

  const maxDelta = Math.max(...stats.map((s) => s.deltaActivists), 0)
  const top3 = rows.slice(0, 3)

  return (
    <div id="leaderboard" className="section-wrap mx-auto w-full max-w-6xl px-4 sm:px-3">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#ffa400]">Соревнование</div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">Лидерборд регионов</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/90">Рейтинг регионов по привлечённым новичкам. Нажмите на регион для детализации.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-auto ml-auto">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9a93a4]">⌕</span>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Регион или город…" className="w-full rounded-full border border-[#e9e0f2] bg-white py-2.5 pl-8 pr-3.5 text-sm text-[#320066] outline-none transition focus:border-[#ffa400]/40 focus:ring-4 focus:ring-[#ffa400]/10 sm:w-60" />
          </div>
        </div>
      </div>

      {top3.length === 3 && !q && (
        <div className="mb-5 -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
          {[top3[0], top3[1], top3[2]].map((row) => {
            if (!row) return null
            const rank = top3.indexOf(row) + 1
            const isFirst = rank === 1
            const podiumOrder = isFirst ? 'sm:order-2' : rank === 2 ? 'sm:order-1' : 'sm:order-3'
            return (
              <button
                key={row.region.id}
                onClick={() => onSelectRegion(row.region.id)}
                className={`relative min-w-[78%] snap-center overflow-hidden rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-lg sm:min-w-0 ${podiumOrder} ${isFirst ? 'border-[#ffa400]/35 bg-gradient-to-b from-[#fff1d6] to-white shadow-md ring-1 ring-[#ffa400]/15 sm:-mt-2 sm:pb-6' : rank===2 ? 'border-[#d9cde8] bg-gradient-to-b from-[#faf7fd] to-white' : 'border-[#e9e0f2] bg-white'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xl font-extrabold text-white ${isFirst ? 'bg-[#ffa400]' : rank===2 ? 'bg-[#7c2bb5]' : 'bg-[#4c008e]'}`}>{rank}</span>
                  {isFirst && <span className="rounded-full bg-[#4c008e] px-2 py-0.5 text-[10px] font-bold text-white">ЛИДЕР</span>}
                </div>
                <div className="truncate font-bold text-3xl text-[#320066]">{row.region.name}</div>
                <div className="mt-1 text-3xl font-extrabold text-[#ffa400]">{(row.stats?.activistsCount || 0).toLocaleString('ru-RU')}</div>
                <div className="mt-1 text-xs text-[#6b6472]">{row.thresholdPctRaw}% от порога · {(row.conv * 100).toFixed(1)}% конверсия</div>
              </button>
            )
          })}
        </div>
      )}

      <div className="grid gap-4">
        {rows.map((row, idx) => {
          const s = row.stats
          const isBurst = s && s.deltaActivists > 0 && s.deltaActivists === maxDelta
          const rankTone = idx === 0 ? 'bg-[#ffa400] text-white shadow' : idx === 1 ? 'bg-[#fff1d6] text-[#ffa400]' : idx === 2 ? 'bg-[#f5eefb] text-[#4c008e]' : 'bg-[#faf7fd] text-[#6b6472]'
          return (
            <button
              key={row.region.id}
              onClick={() => onSelectRegion(row.region.id)}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:p-5 ${idx === 0 ? 'border-[#ffa400]/35 bg-gradient-to-r from-[#ffa400]/70 via-white to-white ring-1 ring-[#ffa400]/10' : 'border-[#e9e0f2] bg-white hover:border-[#ffa400]/25'}`}
              style={{ animation: `rise .5s cubic-bezier(.2,.8,.2,1) ${Math.min(idx, 8) * 40}ms both` }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex items-center gap-4 lg:w-[280px]">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold ${rankTone}`}>{idx + 1}</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl font-bold text-[#320066]">{row.region.name}</span>
                      {idx === 0 && <span className="rounded-full bg-[#fff1d6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#ffa400]">Лидер</span>}
                      {isBurst && <span className="animate-pulse-glow rounded-full bg-gradient-to-r from-[#4c008e] to-[#ffa400] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Прорыв</span>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${row.thresholdOk ? 'bg-[#fff1d6] text-[#ffa400]' : 'bg-[#f5eefb] text-[#7c2bb5]'}`}>{row.thresholdOk ? 'Порог достигнут' : 'В гонке'}</span>
                      <span className="text-xs text-[#6b6472]">{row.region.cities.length} городов · порог {row.region.minThreshold}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[#5f5768]">Новички <b className="text-[#ffa400]">{(s?.activistsCount || 0).toLocaleString('ru-RU')}</b> / {row.region.minThreshold.toLocaleString('ru-RU')}</span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-[#fff1d6] px-2 py-0.5 font-bold text-[#ffa400]">{row.thresholdPctRaw}%</span>
                      <span className="text-[#6b6472]">конверсия {(row.conv * 100).toFixed(1)}%</span>
                    </span>
                  </div>
                  <div className="relative h-3.5 overflow-hidden rounded-full bg-[#efe8f6] ring-1 ring-inset ring-[#e9e0f2]">
                    <div className={`h-full rounded-full transition-all duration-700 ${row.thresholdOk ? 'bg-gradient-to-r from-[#ffb52e] to-[#ffa400]' : 'bg-gradient-to-r from-[#7c2bb5] to-[#ffa400]'}`} style={{ width: `${row.thresholdPct}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6b6472]">
                    <span>Заявлено: <b className="text-[#4c008e]">{s?.fgCount || 0}</b></span>
                    <span>Подтверждено: <b className="text-[#4c008e]">{s?.appCount || 0}</b></span>
                    <span>Отклонено: <b className="text-[#4c008e]">{s?.rejectedCount || 0}</b></span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#eee7f5] pt-3 sm:gap-4 lg:border-0 lg:pt-0">
                  <div className="flex flex-col items-start sm:items-end">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9a93a4]">Тренд</div>
                    <Spark values={row.trend} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold tracking-tight text-[#ffa400] transition-transform group-hover:scale-105 sm:text-3xl">{(s?.activistsCount || 0).toLocaleString('ru-RU')}</div>
                    <div className={`text-sm font-bold ${(s?.deltaActivists || 0) > 0 ? 'text-[#ffa400]' : (s?.deltaActivists || 0) < 0 ? 'text-rose-600' : 'text-[#9a93a4]'}`}>
                      {(s?.deltaActivists || 0) > 0 ? '↑ +' : (s?.deltaActivists || 0) < 0 ? '↓ ' : '• '}{Math.abs(s?.deltaActivists || 0).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1d6] text-[#ffa400] transition group-hover:translate-x-1 group-hover:bg-[#ffa400] group-hover:text-white">→</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
