'use client'

import { useEffect, useMemo, useState } from 'react'
import { Leaderboard } from '@/components/Leaderboard'
import { RegionDetailsModal } from '@/components/RegionDetailsModal'
import { ShareCardGenerator } from '@/components/ShareCardGenerator'
import { SiteHeader } from '@/components/SiteHeader'
import { CountUp } from '@/components/CountUp'
import { CampGallery } from '@/components/CampGallery'
import { getPublished, loadState } from '@/lib/data'
import type { AppState, Snapshot } from '@/lib/types'

function useCountdown(target: string) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const t = setInterval(tick, 60000)
    return () => clearInterval(t)
  }, [])
  const diff = now === null ? 0 : Math.max(0, new Date(target).getTime() - now)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  return { days, hours, ready: now !== null }
}

export default function Home() {
  const [state, setState] = useState<AppState | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [showConditions, setShowConditions] = useState(false)

  useEffect(() => {
    setState(loadState())
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'camp-race-state-v5-regions') setState(loadState())
    }
    const onFocus = () => setState(loadState())
    const interval = window.setInterval(() => setState(loadState()), 5000)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
      window.clearInterval(interval)
    }
  }, [])

  const snapshot: Snapshot | null = state ? getPublished(state) : null
  const regions = state?.regions || []
  const countdown = useCountdown('2026-12-22T00:00:00+05:00')

  const totalActivists = useMemo(() => {
    if (!snapshot) return 0
    return snapshot.stats.reduce((a, s) => a + s.activistsCount, 0)
  }, [snapshot])

  if (!state || !snapshot) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf7fd]">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#e9e0f2] bg-white px-8 py-10 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e9e0f2] border-t-[#ffa400]" />
          <div className="font-semibold text-[#4c008e]">Загрузка дашборда…</div>
        </div>
      </main>
    )
  }

  const selectedRegion = regions.find((r) => r.id === selected)

  return (
    <main className="relative min-h-screen overflow-x-clip bg-white pb-0 text-[#2b2433]">
      <SiteHeader />

      <section className="relative isolate overflow-hidden min-h-screen bg-white pt-24 text-[#2b2433]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_10%,rgba(255,164,0,0.10),transparent_40%),radial-gradient(ellipse_at_90%_20%,rgba(76,0,142,0.08),transparent_38%),linear-gradient(180deg,#ffffff_0%,#fcfaff_55%,#f5eefb_100%)]" />
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#ffa400]/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[-8%] top-10 h-[26rem] w-[26rem] rounded-full bg-[#4c008e]/10 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-[90%] items-center gap-8 px-4 pb-10 pt-4 sm:px-3 sm:pb-12 sm:pt-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-8 lg:pb-16 lg:pt-10 lg:px-4">
          <div className="relative z-10 animate-fade-up">
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ffa400]/25 bg-[#fff1d6] px-3.5 py-1.5 text-xs font-bold text-[#8a5a00]">
                <span>🏕</span> Приз — кэмп победителю
              </span>
            </div>

            <h1 className="max-w-3xl text-[2.1rem] font-extrabold leading-[1.02] tracking-tight text-[#320066] sm:text-5xl lg:text-[4.1rem]">
              Путь к Кэмпу:
              <span className="mt-1 block text-[#4c008e]">гонка регионов<br />по привлечению<br /><span className="text-[#ffa400]">новых активистов</span></span>
            </h1>

            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <a href="#leaderboard" className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ffa400] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#ffa400]/20 transition hover:-translate-y-0.5 hover:bg-[#e69400] sm:w-auto">
                Смотреть рейтинг <span className="transition group-hover:translate-x-0.5">→</span>
              </a>
              <a href="#camp" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d9cde8] bg-white px-6 py-3.5 text-sm font-bold text-[#4c008e] shadow-sm transition hover:bg-[#faf7fd] sm:w-auto">
                Фото из кэмпов
              </a>
              <div className="flex w-full items-center justify-center gap-2 rounded-full border border-[#e9e0f2] bg-[#faf7fd] px-4 py-2.5 text-sm text-[#5f5768] sm:w-auto sm:justify-start">
                <span>До 22 декабря 2026:</span>
                <b className="text-[#320066]">{countdown.ready ? `${countdown.days} д ${countdown.hours} ч` : '—'}</b>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-[#ffa400]/15 via-transparent to-[#4c008e]/10 blur-2xl sm:-inset-4" />
            <div className="relative sm:animate-float">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-[#e9e0f2] bg-white p-1.5 shadow-xl shadow-[#4c008e]/10 sm:rounded-[2rem] sm:p-2">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[1.1rem] sm:aspect-[5/4] sm:rounded-[1.5rem]">
                  <img src="/images/camp.jpg" alt="Кэмп Жаңа Адамдар" className="h-full w-full scale-[1.02] object-cover" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#320066]/30 via-transparent to-[#ffa400]/10" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#320066]/55 to-transparent" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#e9e0f2] bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b6472]">Новеньких привлечено</div>
                <div className="text-2xl font-extrabold text-[#ffa400]"><CountUp value={totalActivists} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CampGallery />

      <div className="relative z-10 space-y-8 bg-[#320066] pt-8 pb-14 sm:space-y-10 sm:pt-10 sm:pb-16">
        <Leaderboard regions={regions} stats={snapshot.stats} snapshots={state.snapshots} onSelectRegion={setSelected} />

        <ShareCardGenerator regions={regions} snapshot={snapshot} />
      </div>

      {selectedRegion && <RegionDetailsModal region={selectedRegion} snapshot={snapshot} onClose={() => setSelected(null)} />}
      {showConditions && <ContestConditionsModal onClose={() => setShowConditions(false)} />}

      <footer className="border-t border-white/10 bg-[#320066]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-3">
          <div>
            <div className="text-base font-extrabold text-white">Жаңа адамдар · Гонка регионов</div>
            <div className="mt-0.5 text-sm text-white/70">Данные обновляются.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <a href="#share" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20">Отчёт для чата</a>
            <span className="rounded-full bg-[#fff1d6] px-4 py-2 text-xs font-bold text-[#ffa400] ring-1 ring-[#ffa400]/10">{regions.length} регионов участвуют в конкурсе</span>
          </div>
        </div>
      </footer>
    </main>
  )
}

function ContestConditionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="contest-conditions-title">
      <div className="absolute inset-0 bg-[#320066]/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#e9e0f2] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#e9e0f2] bg-[#faf7fd] px-5 py-4 sm:px-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#ffa400]">Конкурс</div>
            <h2 id="contest-conditions-title" className="text-xl font-extrabold text-[#320066] sm:text-2xl">Условия конкурса</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e9e0f2] bg-white text-lg font-bold text-[#4c008e] transition hover:bg-[#f5eefb]"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 text-sm leading-relaxed text-[#2b2433] sm:px-6 sm:py-6 sm:text-[15px]">
          <div className="space-y-5">
            <section className="space-y-3">
              <p>🔥 14 ноября на общем сборе мы объявили о запуске конкурса, в котором регионы и столицы будут соревноваться между собой по привлечению новых людей в Движение.</p>
              <p>📌 <strong>Наша цель</strong> — привлечь как можно больше новых людей, вовлечь их в деятельность Движения и довести до статуса Активистов.</p>
              <p>Здесь важен вклад каждого города и каждого человека, ведь именно из небольших результатов складывается общий успех команды. Поэтому побеждает не тот, кто соберёт больше регистраций, а тот, кто сможет довести больше людей до реального участия в нашей деятельности!</p>
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-medium text-amber-900">Дата начала конкурса 20 ноября 2026 года. Дата конца конкурса будут объявлены и обновлены в ближайшем времени</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-extrabold text-[#320066] sm:text-lg">1. Участники конкурса и порог</h3>
              <div>
                <p className="font-semibold">В конкурсе участвуют:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li><strong>Регионы:</strong> Север, Юг, Запад, Восток.</li>
                  <li><strong>Столицы:</strong> Астана, Алматы, Шымкент.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-[#ffa400]/20 bg-[#fff1d6] px-4 py-3">
                <p>🔼 <strong>Минимальный порог для участия в конкурсе:</strong> 100 новых Активистов, принявших участие в декабрьском испытании от Региона или Столицы.</p>
              </div>
              <p>❗️ <strong>Важно:</strong> после достижения порога команды продолжают набирать участников. Победит тот Регион или Столица, которые приведут наибольшее количество новичков, успешно прошедших все этапы конкурса.</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-extrabold text-[#320066] sm:text-lg">2. Условия конкурса</h3>

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#4c008e]">Этап 1. Сбор данных о прошедших фокус-группу</h4>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>Новый человек регистрируется в приложении Zhana Adamdar.</li>
                  <li>Проходит фокус-группу.</li>
                  <li>Ответственные собирают необходимые данные, делают фото и отправляют команде данных — Unity всю информацию.</li>
                  <li>Далее Unity принимают заявку человека в приложении, человек получает статус — Сторонник.</li>
                </ol>
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">❗️ <strong>ВАЖНО!</strong> В зачёт конкурса идут только те люди, которые зарегистрировались через приложение и прошли фокус-группу. То есть, если человек пришёл на ФГ вне слота, его необходимо зарегистрировать на слот в приложении на месте, а затем провести ФГ.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#4c008e]">Этап 2. Формирование базы новых людей</h4>
                <p>Команда данных — Unity создает отдельную базу всех новых людей, участвующих в конкурсе. При получении списков Акций, рейдов и кейсов команда отмечает тех, кто принял участие в деятельности Движения, и меняют им статус со Сторонника на Активиста в приложении.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#4c008e]">Этап 3. Прохождение испытания</h4>
                <p>Новые люди, получившие статус Активиста, должны принять участие в декабрьском испытании.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#4c008e]">Этап 4. Подведение итогов</h4>
                <p>После завершения испытания подсчитывается количество новых Активистов, успешно прошедших все этапы, и определяется победитель.</p>
                <p>Каждый новый Активист, выполнивший все условия, засчитывается как <strong>1 человек</strong> в результат своей команды.</p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900">
                <p className="font-extrabold">❗️ Не засчитываются:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>Те, кто только зарегистрировался в приложении или прошел ФГ вне слота.</li>
                  <li>Те, кто прошёл ФГ, но не участвовал в Акции, рейде или кейсе.</li>
                  <li>Те, кто не сдавал испытание.</li>
                  <li>Те, чьи данные не были подтверждены.</li>
                </ul>
                <p className="mt-2"><strong>Итоговый результат</strong> = общее количество новых Активистов, успешно прошедших все этапы конкурса.</p>
              </div>
            </section>

            <section className="space-y-3 border-t border-[#e9e0f2] pt-4">
              <p>🔥 Теперь, на ближайший месяц задача каждого Региона и Столицы — привести минимум 100 новых Активистов, обеспечить их участие в деятельности Движения и помочь им пройти все этапы конкурса. При этом 100 человек — это только стартовый порог. Чем больше новых людей успешно пройдут все этапы, тем выше шансы вашей команды на победу!</p>
              <p>⚡️ Этот конкурс — возможность показать свой потенциал, сплочённость команд и способность привлекать и развивать новых людей. Покажем, какой Регион или Столица смогут привлечь и вовлечь в Движение больше всего новых людей! Удачи всем командам!</p>
            </section>
          </div>
        </div>

        <div className="border-t border-[#e9e0f2] bg-[#faf7fd] px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="rounded-full bg-[#4c008e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#320066]">Понятно</button>
          </div>
        </div>
      </div>
    </div>
  )
}
