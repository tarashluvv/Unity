'use client'
import type { Region, Snapshot, VerifiedRecord } from '@/lib/types'

export function RegionDetailsModal({ region, snapshot, onClose }: { region: Region; snapshot: Snapshot; onClose: () => void }) {
  const s = snapshot.stats.find((x) => x.regionId === region.id)
  const recs: VerifiedRecord[] = snapshot.records.filter((r) => r.regionId === region.id)
  const noApp = recs.filter((r) => r.status === 'NOT_IN_APP').length || Math.max(0, (s?.fgCount || 0) - (s?.appCount || 0))
  const notExam = recs.filter((r) => r.rejectReason?.includes('декабрь') || r.rejectReason?.includes('этап')).length || Math.max(0, (s?.examCount || 0) - (s?.activistsCount || 0))
  const dup = recs.filter((r) => r.status === 'DUPLICATE').length

  const steps = [
    { label: 'Пришли на ФГ (по спискам)', value: s?.fgCount || 0, tone: 'from-[#d9cde8] to-[#e9e0f2]' },
    { label: 'Найдены в базе приложения', value: s?.appCount || 0, tone: 'from-[#9272b8] to-[#7c2bb5]' },
    { label: 'Переведены на декабрьское испытание', value: s?.examCount || 0, tone: 'from-[#4c008e] to-[#6b1ba8]' },
    { label: 'Подтверждённые новички', value: s?.activistsCount || 0, tone: 'from-[#ffa400] to-[#ffb52e]' },
  ]
  const max = Math.max(1, steps[0].value)
  const byCity = s?.byCity?.length ? s.byCity : region.cities.map((c) => ({ city: c, fgCount: 0, appCount: 0, examCount: 0, activistsCount: 0, rejectedCount: 0 }))
  const pct = Math.min(100, Math.round(((s?.activistsCount || 0) / Math.max(1, region.minThreshold)) * 100))
  const conv = s && s.fgCount > 0 ? (s.activistsCount / s.fgCount) * 100 : 0

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#320066]/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="animate-rise max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-[1.75rem] bg-[#fcfaff] shadow-2xl sm:rounded-[1.75rem]" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 border-b border-[#e9e0f2] bg-white/92 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-[#d9cde8] sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#4c008e] to-[#ffa400] text-lg font-extrabold text-white shadow-md sm:h-12 sm:w-12">{region.name.slice(0,1)}</div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-extrabold text-[#320066] sm:text-2xl">{region.name}</h3>
                <p className="text-xs text-[#6b6472] sm:text-sm">Воронка, прогресс к порогу и вклад городов · {region.cities.length} городов</p>
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-full border border-[#e9e0f2] bg-white px-3 py-1.5 text-sm font-semibold text-[#4c008e] transition hover:bg-[#f5eefb] sm:px-3.5">Закрыть</button>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
            <Metric label="Новички" value={s?.activistsCount || 0} accent />
            <Metric label="Порог" value={region.minThreshold} />
            <Metric label="Прогресс" value={`${pct}%`} accent={pct >= 100} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#e9e0f2] bg-white p-4 shadow-sm sm:p-5">
              <h4 className="mb-4 flex items-center gap-2 font-bold text-[#320066]"><span className="h-2 w-2 rounded-full bg-[#ffa400]" />Воронка</h4>
              <div className="space-y-4">
                {steps.map((st, i) => {
                  const w = (st.value / max) * 100
                  const prev = i > 0 ? steps[i - 1].value : st.value
                  const stepConv = prev > 0 ? Math.round((st.value / prev) * 100) : 0
                  return (
                    <div key={st.label}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="text-[#4c008e]"><span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f5eefb] text-[10px] font-bold text-[#4c008e]">{i + 1}</span>{st.label}</span>
                        <span className="flex items-center gap-2 font-bold text-[#320066]">{st.value.toLocaleString('ru-RU')}{i > 0 && <span className="text-[11px] font-semibold text-[#9a93a4]">{stepConv}%</span>}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-[#efe8f6]">
                        <div className={`h-full rounded-full bg-gradient-to-r ${st.tone} transition-all duration-700`} style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e9e0f2] bg-white p-4 shadow-sm sm:p-5">
              <h4 className="mb-4 flex items-center gap-2 font-bold text-[#320066]"><span className="h-2 w-2 rounded-full bg-[#4c008e]" />Разбор отклонений</h4>
              <div className="space-y-3">
                <RejectRow label="Нет в выгрузке приложения" value={noApp} total={s?.fgCount || 0} color="bg-[#7c2bb5]" />
                <RejectRow label="Не сдали / не на этапе испытания" value={notExam} total={s?.examCount || 0} color="bg-[#4c008e]" />
                <RejectRow label="Дубликаты" value={dup} total={(s?.appCount || 0) + dup} color="bg-[#a49aaf]" />
              </div>
              <div className="mt-4 rounded-xl border border-[#e9e0f2] bg-[#faf7fd] p-3 text-xs leading-relaxed text-[#6b6472]">
                Показатели обезличены и рассчитаны по текущему опубликованному срезу. Прирост: <b className={(s?.deltaActivists||0)>=0?'text-[#ffa400]':'text-rose-700'}>{(s?.deltaActivists||0)>=0?'+':''}{s?.deltaActivists||0}</b>.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e9e0f2] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <h4 className="font-bold text-[#320066]">Вклад городов внутри региона</h4>
              <span className="text-xs text-[#6b6472]">по новичкам</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e9e0f2] text-xs uppercase tracking-wide text-[#6b6472]">
                    <th className="px-3 py-2.5 font-semibold">Город</th>
                    <th className="px-3 py-2.5 font-semibold">Заявлено</th>
                    <th className="px-3 py-2.5 font-semibold">Подтв.</th>
                    <th className="px-3 py-2.5 font-semibold">Новички</th>
                    <th className="px-3 py-2.5 font-semibold">Отклонено</th>
                    <th className="px-3 py-2.5 font-semibold">Вклад</th>
                  </tr>
                </thead>
                <tbody>
                  {byCity.map((c) => {
                    const share = s && s.activistsCount > 0 ? Math.round((c.activistsCount / s.activistsCount) * 100) : 0
                    return (
                      <tr key={c.city} className="border-b border-[#f2ecf8] transition hover:bg-[#faf7fd]">
                        <td className="px-3 py-3 font-semibold text-[#320066]">{c.city}</td>
                        <td className="px-3 py-3 text-[#5f5768]">{c.fgCount}</td>
                        <td className="px-3 py-3 text-[#5f5768]">{c.appCount}</td>
                        <td className="px-3 py-3 font-extrabold text-[#ffa400]">{c.activistsCount}</td>
                        <td className="px-3 py-3 text-[#5f5768]">{c.rejectedCount}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-[#efe8f6]"><div className="h-full rounded-full bg-gradient-to-r from-[#4c008e] to-[#ffa400]" style={{ width: `${share}%` }} /></div>
                            <span className="text-xs font-semibold text-[#6b6472]">{share}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3.5 ${accent ? 'border-[#ffa400]/20 bg-gradient-to-br from-[#fff1d6] to-white' : 'border-[#e9e0f2] bg-white'}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6472]">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${accent ? 'text-[#ffa400]' : 'text-[#320066]'}`}>{typeof value === 'number' ? value.toLocaleString('ru-RU') : value}</div>
    </div>
  )
}

function RejectRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="rounded-xl border border-[#e9e0f2] p-3">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-[#5f5768]">{label}</span>
        <span className="font-extrabold text-[#320066]">{value.toLocaleString('ru-RU')}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#efe8f6]"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
    </div>
  )
}
