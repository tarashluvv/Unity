'use client'

import { useEffect, useMemo, useState } from 'react'
import { Leaderboard } from '@/components/Leaderboard'
import { ShareCardGenerator } from '@/components/ShareCardGenerator'
import { SiteHeader } from '@/components/SiteHeader'
import { CountUp } from '@/components/CountUp'
import { CampGallery } from '@/components/CampGallery'
import { getPublished, loadState } from '@/lib/data'
import { useT } from '@/lib/i18n'
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
  const { t } = useT()
  const [state, setState] = useState<AppState | null>(null)
  const [showConditions, setShowConditions] = useState(false)

  useEffect(() => {
    let alive = true
    const refresh = async () => {
      const s = await loadState()
      if (alive) setState(s)
    }
    void refresh()
    const onFocus = () => { void refresh() }
    const interval = window.setInterval(() => { void refresh() }, 5000)
    window.addEventListener('focus', onFocus)
    return () => {
      alive = false
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
          <div className="font-semibold text-[#4c008e]">{t('Загрузка дашборда…')}</div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-white pb-0 text-[#2b2433]">
      <SiteHeader />

      <section className="relative isolate overflow-hidden min-h-screen bg-white pt-24 text-[#2b2433]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_10%,rgba(255,164,0,0.10),transparent_40%),radial-gradient(ellipse_at_90%_20%,rgba(76,0,142,0.08),transparent_38%),linear-gradient(180deg,#ffffff_0%,#fcfaff_55%,#f5eefb_100%)]" />
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#ffa400]/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[-8%] top-10 h-[26rem] w-[26rem] rounded-full bg-[#4c008e]/10 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-[90%] items-center gap-8 px-4 pb-10 pt-4 sm:px-3 sm:pb-12 sm:pt-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-8 lg:pb-16 lg:pt-10 lg:px-4">
          <div className="relative z-10 animate-fade-up">
            <h1 className="max-w-3xl text-[2.1rem] font-extrabold leading-[1.02] tracking-tight text-[#320066] sm:text-5xl lg:text-[4.1rem]">
              {t('Путь к Кэмпу')}
            </h1>

            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <a href="#leaderboard" className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ffa400] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#ffa400]/20 transition hover:-translate-y-0.5 hover:bg-[#e69400] sm:w-auto">
                {t('Смотреть лидерборд')} <span className="transition group-hover:translate-x-0.5">→</span>
              </a>
              <div className="flex w-full items-center justify-center gap-2 rounded-full border border-[#e9e0f2] bg-[#faf7fd] px-4 py-2.5 text-sm text-[#5f5768] sm:w-auto sm:justify-start">
                <span>{t('До 22 декабря 2026:')}</span>
                <b className="text-[#320066]">{countdown.ready ? `${countdown.days} д ${countdown.hours} ч` : '—'}</b>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-[#ffa400]/15 via-transparent to-[#4c008e]/10 blur-2xl sm:-inset-4" />
            <div className="relative sm:animate-float">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-[#e9e0f2] bg-white p-1.5 shadow-xl shadow-[#4c008e]/10 sm:rounded-[2rem] sm:p-2">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[1.1rem] sm:aspect-[5/4] sm:rounded-[1.5rem]">
                  <img src="/images/camp.jpg" alt={t('Кэмп Жаңа адамдар')} className="h-full w-full scale-[1.02] object-cover" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#320066]/30 via-transparent to-[#ffa400]/10" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#320066]/55 to-transparent" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#e9e0f2] bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#6b6472]">{t('Новеньких привлечено')}</div>
                <div className="text-2xl font-extrabold text-[#ffa400]"><CountUp value={totalActivists} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CampGallery />

      <div className="relative z-10 space-y-8 bg-[#320066] pt-8 pb-14 sm:space-y-10 sm:pt-10 sm:pb-16">
        <Leaderboard regions={regions} stats={snapshot.stats} snapshots={state.snapshots} />

        <ShareCardGenerator regions={regions} snapshot={snapshot} />
      </div>

      {showConditions && <ContestConditionsModal onClose={() => setShowConditions(false)} />}

      <footer className="border-t border-white/10 bg-[#320066]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-3">
          <div>
            <div className="text-base font-extrabold text-white">{t('Жаңа адамдар · Гонка регионов')}</div>
            <div className="mt-0.5 text-sm text-white/70">{t('Данные обновляются.')}</div>
          </div>
          <img src="/images/logo.svg" alt="Жаңа адамдар. Unity" className="h-9 w-auto shrink-0 transition-transform duration-300 group-hover:scale-[1.02] sm:h-11" />
        </div>
      </footer>
    </main>
  )
}

function ContestConditionsModal({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="contest-conditions-title">
      <div className="absolute inset-0 bg-[#320066]/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#e9e0f2] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#e9e0f2] bg-[#faf7fd] px-5 py-4 sm:px-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#ffa400]">{t('Конкурс')}</div>
            <h2 id="contest-conditions-title" className="text-xl font-extrabold text-[#320066] sm:text-2xl">{t('Условия конкурса')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e9e0f2] bg-white text-lg font-bold text-[#4c008e] transition hover:bg-[#f5eefb]"
            aria-label={t('Закрыть')}
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 text-sm leading-relaxed text-[#2b2433] sm:px-6 sm:py-6 sm:text-[15px]">
          <div className="space-y-5">
            <section className="space-y-3">
              <p>{t('🔥 14 ноября на общем сборе мы объявили о запуске конкурса, в котором регионы и столицы будут соревноваться между собой по привлечению новых людей в Движение.')}</p>
              <p>📌 <strong>{t('Наша цель')}</strong>{t(' — привлечь как можно больше новых людей, вовлечь их в деятельность Движения и довести до статуса Активистов.')}</p>
              <p>{t('Здесь важен вклад каждого города и каждого человека, ведь именно из небольших результатов складывается общий успех команды. Поэтому побеждает не тот, кто соберёт больше регистраций, а тот, кто сможет довести больше людей до реального участия в нашей деятельности!')}</p>
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-medium text-amber-900">{t('Дата начала конкурса 20 ноября 2026 года. Дата конца конкурса будут объявлены и обновлены в ближайшем времени')}</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-extrabold text-[#320066] sm:text-lg">{t('1. Участники конкурса и порог')}</h3>
              <div>
                <p className="font-semibold">{t('В конкурсе участвуют:')}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li><strong>{t('Регионы:')}</strong>{t(' Север, Юг, Запад, Восток.')}</li>
                  <li><strong>{t('Столицы:')}</strong>{t(' Астана, Алматы, Шымкент.')}</li>
                </ul>
              </div>
              <div className="rounded-xl border border-[#ffa400]/20 bg-[#fff1d6] px-4 py-3">
                <p>🔼 <strong>{t('Минимальный порог для участия в конкурсе:')}</strong> {t('100 новых Активистов, принявших участие в декабрьском испытании от Региона или Столицы.')}</p>
              </div>
              <p>❗️ <strong>{t('Важно:')}</strong> {t('после достижения порога команды продолжают набирать участников. Победит тот Регион или Столица, которые приведут наибольшее количество новичков, успешно прошедших все этапы конкурса.')}</p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-extrabold text-[#320066] sm:text-lg">{t('2. Условия конкурса')}</h3>

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#4c008e]">{t('Этап 1. Сбор данных о прошедших фокус-группу')}</h4>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>{t('Новый человек регистрируется в приложении Zhana Adamdar.')}</li>
                  <li>{t('Проходит фокус-группу.')}</li>
                  <li>{t('Ответственные собирают необходимые данные, делают фото и отправляют команде данных — Unity всю информацию.')}</li>
                  <li>{t('Далее Unity принимают заявку человека в приложении, человек получает статус — Сторонник.')}</li>
                </ol>
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">❗️ <strong>{t('ВАЖНО!')}</strong> {t('В зачёт конкурса идут только те люди, которые зарегистрировались через приложение и прошли фокус-группу. То есть, если человек пришёл на ФГ вне слота, его необходимо зарегистрировать на слот в приложении на месте, а затем провести ФГ.')}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#4c008e]">{t('Этап 2. Формирование базы новых людей')}</h4>
                <p>{t('Команда данных — Unity создает отдельную базу всех новых людей, участвующих в конкурсе. При получении списков Акций, рейдов и кейсов команда отмечает тех, кто принял участие в деятельности Движения, и меняют им статус со Сторонника на Активиста в приложении.')}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#4c008e]">{t('Этап 3. Прохождение испытания')}</h4>
                <p>{t('Новые люди, получившие статус Активиста, должны принять участие в декабрьском испытании.')}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-[#4c008e]">{t('Этап 4. Подведение итогов')}</h4>
                <p>{t('После завершения испытания подсчитывается количество новых Активистов, успешно прошедших все этапы, и определяется победитель.')}</p>
                <p>{t('Каждый новый Активист, выполнивший все условия, засчитывается как')} <strong>{t('1 человек')}</strong> {t('в результат своей команды.')}</p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900">
                <p className="font-extrabold">{t('❗️ Не засчитываются:')}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>{t('Те, кто только зарегистрировался в приложении или прошел ФГ вне слота.')}</li>
                  <li>{t('Те, кто прошёл ФГ, но не участвовал в Акции, рейде или кейсе.')}</li>
                  <li>{t('Те, кто не сдавал испытание.')}</li>
                  <li>{t('Те, чьи данные не были подтверждены.')}</li>
                </ul>
                <p className="mt-2"><strong>{t('Итоговый результат')}</strong> {t('= общее количество новых Активистов, успешно прошедших все этапы конкурса.')}</p>
              </div>
            </section>

            <section className="space-y-3 border-t border-[#e9e0f2] pt-4">
              <p>{t('🔥 Теперь, на ближайший месяц задача каждого Региона и Столицы — привести минимум 100 новых Активистов, обеспечить их участие в деятельности Движения и помочь им пройти все этапы конкурса. При этом 100 человек — это только стартовый порог. Чем больше новых людей успешно пройдут все этапы, тем выше шансы вашей команды на победу!')}</p>
              <p>{t('⚡️ Этот конкурс — возможность показать свой потенциал, сплочённость команд и способность привлекать и развивать новых людей. Покажем, какой Регион или Столица смогут привлечь и вовлечь в Движение больше всего новых людей! Удачи всем командам!')}</p>
            </section>
          </div>
        </div>

        <div className="border-t border-[#e9e0f2] bg-[#faf7fd] px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="rounded-full bg-[#4c008e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#320066]">{t('Понятно')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
