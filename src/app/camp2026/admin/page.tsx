'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { getInitialState, getPublished, loadState, saveState } from '@/lib/data'
import { aggregateDirect, parseAppRows, parseRegionRows, reconcile } from '@/lib/matcher'
import type { AppState, ReconcileSummary, Region, Snapshot } from '@/lib/types'

function readSheet(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        resolve(XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[])
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [state, setState] = useState<AppState | null>(null)
  const [appRows, setAppRows] = useState<Record<string, unknown>[]>([])
  const [regionRows, setRegionRows] = useState<Record<string, unknown>[]>([])
  const [appName, setAppName] = useState('')
  const [regionName, setRegionName] = useState('')
  const [summary, setSummary] = useState<ReconcileSummary | null>(null)
  const [comment, setComment] = useState('')
  const [regionsDraft, setRegionsDraft] = useState<Region[]>([])
  const [sessionStart, setSessionStart] = useState<number | null>(null)
  const [now, setNow] = useState<number | null>(null)
  const [mode, setMode] = useState<'pair' | 'single'>('single')
  const [publishedFlash, setPublishedFlash] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('admin-auth') === '1') setAuthed(true)
    const s = loadState()
    setState(s)
    setRegionsDraft(s.regions)
  }, [])

  useEffect(() => {
    if (!sessionStart) return
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [sessionStart])

  const published = useMemo(() => (state ? getPublished(state) : null), [state])

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6f3] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#e7e1d8] bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-xl font-extrabold text-[#241814]">Вход в админку</h1>
          <p className="mb-4 text-sm text-[#6b625c]">
            Демо-доступ: пароль <code className="rounded bg-[#f4efe9] px-1.5 py-0.5 font-semibold text-[#3b2a22]">admin</code>
          </p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Пароль"
            className="mb-3 w-full rounded-xl border border-[#e7e1d8] px-3.5 py-2.5 outline-none focus:border-[#1d6f42]/50 focus:ring-4 focus:ring-[#1d6f42]/10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (pw === 'admin') { sessionStorage.setItem('admin-auth', '1'); setAuthed(true) } else alert('Неверный пароль')
              }
            }}
          />
          <button
            onClick={() => {
              if (pw === 'admin') {
                sessionStorage.setItem('admin-auth', '1')
                setAuthed(true)
              } else alert('Неверный пароль')
            }}
            className="w-full rounded-full bg-[#3b2a22] px-4 py-2.5 font-semibold text-white transition hover:bg-[#241814]"
          >
            Войти
          </button>
          <a href="/camp2026" className="mt-3 block text-center text-sm font-medium text-[#1d6f42] hover:underline">
            ← К дашборду
          </a>
        </div>
      </main>
    )
  }

  if (!state) return <div className="p-8 text-[#3b2a22]">Загрузка…</div>

  const onFile = async (file: File, zone: 'app' | 'region') => {
    const rows = await readSheet(file)
    if (zone === 'app') {
      setAppRows(rows)
      setAppName(file.name)
    } else {
      setRegionRows(rows)
      setRegionName(file.name)
    }
    setSummary(null)
  }

  const runReconcile = () => {
    const prevStats = published?.stats
    if (mode === 'single') {
      const source = appRows.length ? appRows : regionRows
      if (!source.length) return alert('Загрузите файл базы (с колонками Регион, Город, Фамилия, Имя, Номер телефона и показателями)')
      const app = parseAppRows(source, regionsDraft)
      if (!app.length) return alert('Не удалось распознать записи. Проверьте колонки (Регион/Город/Фамилия/Имя/Телефон).')
      const res = aggregateDirect(app, regionsDraft, prevStats)
      setSummary(res)
      return
    }
    if (!appRows.length || !regionRows.length) return alert('Загрузите оба файла: базу приложения и списки регионов')
    const app = parseAppRows(appRows, regionsDraft)
    const region = parseRegionRows(regionRows, regionsDraft)
    const res = reconcile(app, region, regionsDraft, prevStats)
    setSummary(res)
  }

  const publish = () => {
    if (!summary) return
    const snap: Snapshot = {
      id: 'snap-' + Date.now(),
      createdAt: new Date().toISOString(),
      comment: comment || 'Обновление',
      stats: summary.stats,
      records: summary.records,
    }
    const next: AppState = { ...state, regions: regionsDraft, snapshots: [...state.snapshots, snap], publishedSnapshotId: snap.id }
    setState(next)
    saveState(next)
    setComment('')
    setPublishedFlash(true)
    setTimeout(() => setPublishedFlash(false), 3500)
  }

  const saveRegions = () => {
    const next = { ...state, regions: regionsDraft }
    setState(next)
    saveState(next)
    alert('Регионы и пороги сохранены')
  }

  const resetDemo = () => {
    const fresh = getInitialState()
    setState(fresh)
    setRegionsDraft(fresh.regions)
    saveState(fresh)
    setSummary(null)
    alert('Сброшено к демо-данным')
  }

  const downloadErrors = () => {
    if (!summary) return
    const bad = summary.records
      .filter((r) => r.status !== 'VALID_ACTIVIST')
      .map((r) => ({
        ФИО: r.fullName,
        Регион: regionsDraft.find((x) => x.id === r.regionId)?.name || r.regionId,
        Город: r.city || '',
        Статус: r.status,
        Причина: r.rejectReason || '',
      }))
    const ws = XLSX.utils.json_to_sheet(bad.length ? bad : [{ Инфо: 'Нет отклонённых записей' }])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ошибки')
    XLSX.writeFile(wb, 'errors-for-coordinators.xlsx')
  }

  const sessionElapsedMs = sessionStart && now ? Math.max(0, now - sessionStart) : 0
  const sessionLeftMs = Math.max(0, 5 * 60 * 60 * 1000 - sessionElapsedMs)
  const fmtDur = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  const recognizedPct = summary && summary.records.length ? Math.round(((summary.records.length - summary.unrecognized) / summary.records.length) * 100) : 0

  return (
    <main className="relative min-h-screen bg-[#f8f6f3] pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#241814] via-[#3b2a22]/85 to-transparent" />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#241814]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#1d6f42] text-sm font-extrabold text-white shadow">A</div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold leading-tight text-white sm:text-lg">Админ-панель · Гонка регионов</h1>
              <p className="text-[11px] text-white/75 sm:text-xs">Загрузка, сверка, качество данных и публикация срезов</p>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 text-sm sm:w-auto">
            <a href="/camp2026?share=1" className="flex-1 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-center font-semibold text-white transition hover:bg-white/20 sm:flex-none sm:py-1.5">Отчёт</a>
            <a href="/camp2026" className="flex-1 rounded-full bg-white px-3.5 py-2 text-center font-semibold text-[#3b2a22] transition hover:bg-[#e7f4ec] sm:flex-none sm:py-1.5">Дашборд</a>
          </div>
        </div>
      </header>

      <div className="relative mx-auto mt-6 w-full max-w-6xl space-y-6 px-4 sm:px-6">
        <section className="overflow-hidden rounded-[1.5rem] border border-[#e7e1d8] bg-white/95 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#1d6f42]">Сессия</div>
              <h2 className="text-xl font-extrabold text-[#241814]">Непрерывное обновление (5 часов)</h2>
              <p className="mt-1 text-sm text-[#6b625c]">Итеративно загружайте файлы, сверяйте качество и публикуйте срезы до целевого результата.</p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {!sessionStart ? (
                <button onClick={() => { setSessionStart(Date.now()); setNow(Date.now()) }} className="w-full rounded-full bg-[#3b2a22] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#241814] sm:w-auto">Старт сессии</button>
              ) : (
                <>
                  <div className="flex-1 rounded-xl border border-[#e7e1d8] bg-white px-3 py-2 text-sm sm:flex-none"><span className="text-[#6b625c]">Прошло: </span><span className="font-semibold text-[#3b2a22]">{fmtDur(sessionElapsedMs)}</span></div>
                  <div className="flex-1 rounded-xl border border-[#1d6f42]/30 bg-[#e7f4ec] px-3 py-2 text-sm sm:flex-none"><span className="text-[#5a4a40]">Осталось: </span><span className="font-semibold text-[#1d6f42]">{fmtDur(sessionLeftMs)}</span></div>
                  <button onClick={() => { setSessionStart(null); setNow(null) }} className="w-full rounded-full border border-[#d8cec3] px-4 py-2.5 text-sm font-semibold text-[#3b2a22] hover:bg-[#f4efe9] sm:w-auto">Сброс</button>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Итераций (снепшотов)" value={state.snapshots.length} />
            <Metric label="Записей в последней сверке" value={summary ? summary.records.length : '—'} />
            <Metric label="Распознано регион (%)" value={summary ? `${recognizedPct}%` : '—'} accent />
            <Metric label="Не распознан регион" value={summary ? summary.unrecognized : '—'} warn={!!summary && summary.unrecognized > 0} />
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#e7e1d8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#1d6f42]">Настройки</div>
              <h2 className="text-xl font-extrabold text-[#241814]">Регионы и минимальные пороги</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={saveRegions} className="rounded-full bg-[#3b2a22] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#241814]">Сохранить</button>
              <button onClick={resetDemo} className="rounded-full border border-[#d8cec3] px-4 py-2 text-sm font-semibold text-[#3b2a22] transition hover:bg-[#f4efe9]">Сбросить демо</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e7e1d8] text-xs uppercase tracking-wide text-[#6b625c]">
                  <th className="py-2 pr-3">Регион</th>
                  <th className="py-2 pr-3">Города в составе</th>
                  <th className="py-2 pr-3">Алиасы (через запятую)</th>
                  <th className="py-2">Мин. порог</th>
                </tr>
              </thead>
              <tbody>
                {regionsDraft.map((r, i) => (
                  <tr key={r.id} className="border-b border-[#f0ebe4] align-top">
                    <td className="py-2 pr-3 font-semibold text-[#241814]">{r.name}</td>
                    <td className="py-2 pr-3 text-[#5a4a40]">{r.cities.join(', ')}</td>
                    <td className="py-2 pr-3">
                      <input
                        value={r.aliases.join(', ')}
                        onChange={(e) => {
                          const v = [...regionsDraft]
                          v[i] = { ...r, aliases: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }
                          setRegionsDraft(v)
                        }}
                        className="w-full rounded-lg border border-[#e7e1d8] px-2.5 py-1.5 outline-none focus:border-[#1d6f42]/50 focus:ring-2 focus:ring-[#1d6f42]/10"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        value={r.minThreshold}
                        onChange={(e) => {
                          const v = [...regionsDraft]
                          v[i] = { ...r, minThreshold: Number(e.target.value) || 0 }
                          setRegionsDraft(v)
                        }}
                        className="w-28 rounded-lg border border-[#e7e1d8] px-2.5 py-1.5 outline-none focus:border-[#1d6f42]/50 focus:ring-2 focus:ring-[#1d6f42]/10"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#e7e1d8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#1d6f42]">Шаг 1–2</div>
              <h2 className="mb-1 text-xl font-extrabold text-[#241814]">Загрузка и автоматическая сверка</h2>
              <p className="text-sm text-[#6b625c]">
                Статистика считается по 7 регионам. Поддерживаются файлы с <strong>Регионом/Городом</strong> и форматы из «Общего Кампуса».
              </p>
            </div>
            <div className="flex rounded-full border border-[#e7e1d8] bg-[#f8f6f3] p-1 text-sm">
              <button onClick={() => setMode('single')} className={`rounded-full px-3.5 py-1.5 font-semibold transition ${mode === 'single' ? 'bg-[#3b2a22] text-white' : 'text-[#5a4a40] hover:text-[#241814]'}`}>Единый файл</button>
              <button onClick={() => setMode('pair')} className={`rounded-full px-3.5 py-1.5 font-semibold transition ${mode === 'pair' ? 'bg-[#3b2a22] text-white' : 'text-[#5a4a40] hover:text-[#241814]'}`}>Сверка 2 файлов</button>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e7e1d8] bg-[#f8f6f3] p-4">
              <div className="mb-1 font-semibold text-[#241814]">Шаблон: база приложения (конкурс)</div>
              <div className="mb-3 text-sm text-[#6b625c]">Колонки: ID заявки на ФГ, Регион, Город, Фамилия, Имя, Номер телефона, Роль, ГК, Участие в акциях, Участие на рейде, Участие в кейсе.</div>
              <a href="/templates/template-app-base.xlsx" download className="inline-flex rounded-full bg-[#3b2a22] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#241814]">Скачать .xlsx</a>
            </div>
            <div className="rounded-xl border border-[#e7e1d8] bg-[#f8f6f3] p-4">
              <div className="mb-1 font-semibold text-[#241814]">Шаблон: списки от регионов (А/С)</div>
              <div className="mb-3 text-sm text-[#6b625c]">Колонки: Регион, Город, Фамилия, Имя, Номер телефона, Telegram (при наличии). Город маппится в регион автоматически.</div>
              <a href="/templates/template-region-lists.xlsx" download className="inline-flex rounded-full bg-[#3b2a22] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#241814]">Скачать .xlsx</a>
            </div>
          </div>

          {mode === 'single' ? (
            <div className="grid gap-4">
              <Drop
                title="Единая база (рекомендуется для непрерывного обновления)"
                hint="Один файл: Регион/Город, Фамилия, Имя, Телефон, показатели (ГК/акции/рейд/кейс/роль). Подходит для шаблона конкурса и файлов из «Общего Кампуса»."
                name={appName || regionName}
                onFile={(f) => {
                  onFile(f, 'app')
                  setRegionRows([])
                  setRegionName('')
                }}
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Drop title="Зона 1: Эталонная база из приложения" hint="Excel/CSV: Регион, Город, Фамилия, Имя, Номер телефона, показатели/статусы" name={appName} onFile={(f) => onFile(f, 'app')} />
              <Drop title="Зона 2: Списки от регионов (А/С)" hint="Excel/CSV: Регион, Город, Фамилия, Имя, Номер телефона / Telegram" name={regionName} onFile={(f) => onFile(f, 'region')} />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={runReconcile} className="rounded-full bg-[#3b2a22] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#241814]">Рассчитать / Сверить</button>
            <span className="text-sm text-[#6b625c]">Нормализация, маппинг город→регион, дедупликация — автоматически. Режим «Единый файл» агрегирует статистику напрямую.</span>
          </div>
        </section>

        {summary && (
          <section className="rounded-[1.5rem] border border-emerald-200/70 bg-gradient-to-b from-white to-[#e7f4ec]/30 p-5 shadow-sm ring-1 ring-emerald-100 sm:p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#1d6f42]">Шаг 3</div>
            <h2 className="mb-4 text-xl font-extrabold text-[#241814]">Предпросмотр и публикация (снепшот)</h2>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Mini label="Было активистов" value={summary.prevActivists} />
              <Mini label="Станет активистов" value={summary.nextActivists} accent />
              <Mini label="Дельта" value={`${summary.delta >= 0 ? '+' : ''}${summary.delta}`} />
              <Mini label="Отсеяно" value={summary.rejected} warn />
              <Mini label="Не распознан регион" value={summary.unrecognized} warn={summary.unrecognized > 0} />
            </div>
            {summary.unrecognized > 0 && (
              <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-3.5 text-sm text-orange-800">
                <div className="font-semibold">Обнаружены записи без распознанного региона ({summary.unrecognized})</div>
                <div className="mt-1 text-orange-700">
                  Проверьте колонку «Регион/Город» в исходном файле или добавьте алиасы в справочнике регионов выше. Примеры:{' '}
                  {summary.records.filter((r) => r.regionId === 'unknown').slice(0, 5).map((r) => `${r.fullName || '—'} (${r.city || 'без города'})`).join('; ') || '—'}
                </div>
              </div>
            )}
            {summary.records.length === 0 && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
                Не удалось сформировать записи из файла. Проверьте, что в файле есть строки с данными (не только заголовки) и колонки: Регион/Город, Фамилия, Имя, Номер телефона.
              </div>
            )}
            {publishedFlash && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-semibold text-emerald-700 animate-pop">
                ✓ Снепшот опубликован — дашборд обновлён, дельты пересчитаны. Продолжайте цикл до достижения целевых показателей.
              </div>
            )}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий, напр. «Срез пятница 18:00»"
                className="w-full min-w-0 flex-1 rounded-xl border border-[#e7e1d8] px-3.5 py-3 text-sm outline-none focus:border-[#1d6f42]/50 focus:ring-4 focus:ring-[#1d6f42]/10 sm:min-w-[260px]"
              />
              <button onClick={publish} className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:w-auto sm:py-2.5">Опубликовать обновление</button>
              <button onClick={downloadErrors} className="w-full rounded-full border border-[#d8cec3] px-5 py-3 text-sm font-semibold text-[#3b2a22] hover:bg-[#f4efe9] sm:w-auto sm:py-2.5">Скачать отчёт по ошибкам (Excel)</button>
            </div>
          </section>
        )}

        <section className="rounded-[1.5rem] border border-[#e7e1d8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#1d6f42]">История</div>
          <h2 className="mb-4 text-xl font-extrabold text-[#241814]">Опубликованные снепшоты</h2>
          <ul className="space-y-2.5 text-sm">
            {[...state.snapshots].reverse().map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e7e1d8] bg-[#f8f6f3] px-3.5 py-2.5">
                <span className="text-[#2f241c]">
                  <span className="font-semibold">{new Date(s.createdAt).toLocaleString('ru-RU')}</span> — {s.comment}{' '}
                  {s.id === state.publishedSnapshotId && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">опубликован</span>}
                </span>
                <span className="text-[#6b625c]">Активисты: {s.stats.reduce((a, x) => a + x.activistsCount, 0)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}

function Drop({ title, hint, name, onFile }: { title: string; hint: string; name: string; onFile: (f: File) => void }) {
  return (
    <label className="flex cursor-pointer flex-col rounded-2xl border-2 border-dashed border-[#d8cec3] bg-[#f8f6f3] p-5 transition hover:border-[#3b2a22]/40 hover:bg-[#f4efe9]">
      <span className="mb-1 font-semibold text-[#241814]">{title}</span>
      <span className="mb-3 text-sm text-[#6b625c]">{hint}</span>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
      <span className="mt-auto inline-flex w-fit rounded-full border border-[#d8cec3] bg-white px-3.5 py-2 text-sm font-medium text-[#3b2a22]">Выбрать файл</span>
      {name && <span className="mt-2 text-xs font-medium text-emerald-700">Загружено: {name}</span>}
    </label>
  )
}

function Mini({ label, value, accent, warn }: { label: string; value: string | number; accent?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-[#e7e1d8] bg-[#f8f6f3] p-3.5">
      <div className="text-xs text-[#6b625c]">{label}</div>
      <div className={`text-2xl font-extrabold ${warn ? 'text-orange-600' : accent ? 'text-emerald-700' : 'text-[#3b2a22]'}`}>{value}</div>
    </div>
  )
}

function Metric({ label, value, accent, warn }: { label: string; value: string | number; accent?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-[#e7e1d8] bg-white p-3.5">
      <div className="text-xs text-[#6b625c]">{label}</div>
      <div className={`text-2xl font-extrabold ${warn ? 'text-orange-600' : accent ? 'text-emerald-700' : 'text-[#3b2a22]'}`}>{value}</div>
    </div>
  )
}
