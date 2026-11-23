'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Leaderboard } from '@/components/Leaderboard'
import { RegionDetailsModal } from '@/components/RegionDetailsModal'
import { getInitialState, getPublished, loadState, saveState } from '@/lib/data'
import { LangToggle, useT } from '@/lib/i18n'
import { aggregateDirect, parseAppRows, parseRegionRows, reconcile, summarizeRecords } from '@/lib/matcher'
import type { AppState, ReconcileSummary, RecordStatus, Region, Snapshot, VerifiedRecord } from '@/lib/types'

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

export default function AdminDashboard() {
  const { t, lang } = useT()
  const locale = lang === 'kk' ? 'kk-KZ' : 'ru-RU'
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
  const [recordFilter, setRecordFilter] = useState('')
  const [recordLimit, setRecordLimit] = useState(100)
  const [publishedFilter, setPublishedFilter] = useState('')
  const [publishedLimit, setPublishedLimit] = useState(100)
  const [publishedDirty, setPublishedDirty] = useState(false)
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const s = await loadState()
        if (!alive) return
        setState(s)
        setRegionsDraft(s.regions)
      } catch {
        if (!alive) return
        alert(t('Не удалось загрузить данные с сервера'))
      }
    }
    void load()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!sessionStart) return
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [sessionStart])

  const published = useMemo(() => (state ? getPublished(state) : null), [state])
  const selectedRegion = useMemo(() => (selectedRegionId ? regionsDraft.find((r) => r.id === selectedRegionId) || null : null), [selectedRegionId, regionsDraft])

  if (!state) return <div className="p-8 text-[#4c008e]">{t('Загрузка…')}</div>

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
      if (!source.length) return alert(t('Загрузите файл базы (с колонками Регион, Город, Фамилия, Имя, Номер телефона и показателями)'))
      const app = parseAppRows(source, regionsDraft)
      if (!app.length) return alert(t('Не удалось распознать записи. Проверьте колонки (Регион/Город/Фамилия/Имя/Телефон).'))
      const res = aggregateDirect(app, regionsDraft, prevStats)
      setSummary(res)
      return
    }
    if (!appRows.length || !regionRows.length) return alert(t('Загрузите оба файла: базу приложения и списки регионов'))
    const app = parseAppRows(appRows, regionsDraft)
    const region = parseRegionRows(regionRows, regionsDraft)
    const res = reconcile(app, region, regionsDraft, prevStats)
    setSummary(res)
  }

  const publish = async () => {
    if (!summary) return
    const snap: Snapshot = {
      id: 'snap-' + Date.now(),
      createdAt: new Date().toISOString(),
      comment: comment || t('Обновление'),
      stats: summary.stats,
      records: summary.records,
    }
    const next: AppState = { ...state, regions: regionsDraft, snapshots: [...state.snapshots, snap], publishedSnapshotId: snap.id }
    try {
      await saveState(next)
      setState(next)
      setComment('')
      setPublishedFlash(true)
      setTimeout(() => setPublishedFlash(false), 3500)
    } catch {
      alert(t('Не удалось сохранить данные на сервере'))
    }
  }

  const saveRegions = async () => {
    const next = { ...state, regions: regionsDraft }
    try {
      await saveState(next)
      setState(next)
      alert(t('Регионы и пороги сохранены'))
    } catch {
      alert(t('Не удалось сохранить данные на сервере'))
    }
  }

  const resetDemo = async () => {
    if (!confirm(t('Сбросить все данные к демо-состоянию? Текущие настройки и снепшоты будут заменены.'))) return
    const fresh = getInitialState()
    try {
      await saveState(fresh)
      setState(fresh)
      setRegionsDraft(fresh.regions)
      setSummary(null)
      alert(t('Сброшено к демо-данным'))
    } catch {
      alert(t('Не удалось сохранить данные на сервере'))
    }
  }

  const clearSnapshots = async () => {
    if (!state) return
    if (!confirm(t('Удалить все снепшоты и начать с чистого состояния? Настройки регионов сохранятся.'))) return
    const stats = regionsDraft.map((r) => ({
      regionId: r.id,
      fgCount: 0,
      appCount: 0,
      examCount: 0,
      activistsCount: 0,
      rejectedCount: 0,
      deltaActivists: 0,
      byCity: r.cities.map((city) => ({ city, fgCount: 0, appCount: 0, examCount: 0, activistsCount: 0, rejectedCount: 0 })),
    }))
    const snap: Snapshot = {
      id: 'snap-empty-' + Date.now(),
      createdAt: new Date().toISOString(),
      comment: t('Чистый старт'),
      stats,
      records: [],
    }
    const next: AppState = { ...state, regions: regionsDraft, snapshots: [snap], publishedSnapshotId: snap.id }
    try {
      await saveState(next)
      setState(next)
      setSummary(null)
      alert(t('Снепшоты очищены'))
    } catch {
      alert(t('Не удалось сохранить данные на сервере'))
    }
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

  const updateRecord = (idx: number, patch: Partial<VerifiedRecord>) => {
    if (!summary) return
    const records = summary.records.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    const prevStats = published?.stats
    setSummary(summarizeRecords(records, regionsDraft, prevStats))
  }

  const updatePublishedRecord = (idx: number, patch: Partial<VerifiedRecord>) => {
    if (!state) return
    const pubIdx = state.snapshots.findIndex((s) => s.id === state.publishedSnapshotId)
    if (pubIdx < 0) return
    const snap = state.snapshots[pubIdx]
    const records = snap.records.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    const prevStats = pubIdx > 0 ? state.snapshots[pubIdx - 1].stats : undefined
    const { stats } = summarizeRecords(records, regionsDraft, prevStats)
    const nextSnapshots = state.snapshots.map((s, i) => (i === pubIdx ? { ...s, records, stats } : s))
    setState({ ...state, snapshots: nextSnapshots })
    setPublishedDirty(true)
  }

  const savePublishedRecords = async () => {
    if (!state) return
    try {
      await saveState(state)
      setPublishedDirty(false)
      alert(t('Сохранено'))
    } catch {
      alert(t('Не удалось сохранить данные на сервере'))
    }
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

  const filteredRecords = summary
    ? summary.records
        .map((r, idx) => ({ r, idx }))
        .filter(({ r }) => {
          const q = recordFilter.trim().toLowerCase()
          if (!q) return true
          const reg = regionsDraft.find((x) => x.id === r.regionId)?.name || r.regionId
          return [r.fullName, reg, r.city, r.status, r.rejectReason || ''].some((v) => v.toLowerCase().includes(q))
        })
    : []

  const publishedRecords = published?.records || []
  const filteredPublishedRecords = publishedRecords
    .map((r, idx) => ({ r, idx }))
    .filter(({ r }) => {
      const q = publishedFilter.trim().toLowerCase()
      if (!q) return true
      const reg = regionsDraft.find((x) => x.id === r.regionId)?.name || r.regionId
      return [r.fullName, reg, r.city, r.status, r.rejectReason || ''].some((v) => v.toLowerCase().includes(q))
    })

  return (
    <main className="relative min-h-screen bg-[#faf7fd] pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#320066] via-[#4c008e]/85 to-transparent" />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#320066]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#ffa400] text-sm font-extrabold text-white shadow">A</div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold leading-tight text-white sm:text-lg">{t('Админ-панель · Гонка регионов')}</h1>
              <p className="text-[11px] text-white/75 sm:text-xs">{t('Загрузка, сверка, качество данных и публикация срезов')}</p>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 text-sm sm:w-auto">
            <LangToggle compact />
            <a href="/camp2026#share" className="flex-1 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-center font-semibold text-white transition hover:bg-white/20 sm:flex-none sm:py-1.5">{t('Отчёт')}</a>
            <a href="/camp2026" className="flex-1 rounded-full bg-white px-3.5 py-2 text-center font-semibold text-[#4c008e] transition hover:bg-[#fff1d6] sm:flex-none sm:py-1.5">{t('Дашборд')}</a>
            <button
              onClick={async () => {
                await fetch('/api/admin/logout', { method: 'POST' })
                window.location.reload()
              }}
              className="flex-1 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-center font-semibold text-white transition hover:bg-white/20 sm:flex-none sm:py-1.5"
            >
              {t('Выйти')}
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto mt-6 w-full max-w-6xl space-y-6 px-4 sm:px-3">
        <section className="overflow-hidden rounded-[1.5rem] border border-[#e9e0f2] bg-white/95 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#ffa400]">{t('Сессия')}</div>
              <h2 className="text-xl font-extrabold text-[#320066]">{t('Непрерывное обновление (5 часов)')}</h2>
              <p className="mt-1 text-sm text-[#6b6472]">{t('Итеративно загружайте файлы, сверяйте качество и публикуйте срезы до целевого результата.')}</p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {!sessionStart ? (
                <button onClick={() => { setSessionStart(Date.now()); setNow(Date.now()) }} className="w-full rounded-full bg-[#4c008e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#320066] sm:w-auto">{t('Старт сессии')}</button>
              ) : (
                <>
                  <div className="flex-1 rounded-xl border border-[#e9e0f2] bg-white px-3 py-2 text-sm sm:flex-none"><span className="text-[#6b6472]">{t('Прошло:')} </span><span className="font-semibold text-[#4c008e]">{fmtDur(sessionElapsedMs)}</span></div>
                  <div className="flex-1 rounded-xl border border-[#ffa400]/30 bg-[#fff1d6] px-3 py-2 text-sm sm:flex-none"><span className="text-[#5f5768]">{t('Осталось:')} </span><span className="font-semibold text-[#ffa400]">{fmtDur(sessionLeftMs)}</span></div>
                  <button onClick={() => { setSessionStart(null); setNow(null) }} className="w-full rounded-full border border-[#d9cde8] px-4 py-2.5 text-sm font-semibold text-[#4c008e] hover:bg-[#f5eefb] sm:w-auto">{t('Сброс')}</button>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label={t('Итераций (снепшотов)')} value={state.snapshots.length} />
            <Metric label={t('Записей в последней сверке')} value={summary ? summary.records.length : '—'} />
            <Metric label={t('Распознано регион (%)')} value={summary ? `${recognizedPct}%` : '—'} accent />
            <Metric label={t('Не распознан регион')} value={summary ? summary.unrecognized : '—'} warn={!!summary && summary.unrecognized > 0} />
          </div>
        </section>

        {published && (
          <section className="overflow-hidden rounded-[1.5rem] bg-[#320066] py-6 shadow-sm sm:py-8">
            <Leaderboard
              regions={regionsDraft}
              stats={published.stats}
              snapshots={state.snapshots}
              onSelectRegion={setSelectedRegionId}
            />
          </section>
        )}

        <section className="rounded-[1.5rem] border border-[#e9e0f2] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#ffa400]">{t('Настройки')}</div>
              <h2 className="text-xl font-extrabold text-[#320066]">{t('Регионы и минимальные пороги')}</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={saveRegions} className="rounded-full bg-[#4c008e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#320066]">{t('Сохранить')}</button>
              <button onClick={resetDemo} className="rounded-full border border-[#d9cde8] px-4 py-2 text-sm font-semibold text-[#4c008e] transition hover:bg-[#f5eefb]">{t('Сбросить демо')}</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e9e0f2] text-xs uppercase tracking-wide text-[#6b6472]">
                  <th className="py-2 pr-3">{t('Регион')}</th>
                  <th className="py-2 pr-3">{t('Города в составе')}</th>
                  <th className="py-2 pr-3">{t('Алиасы (через запятую)')}</th>
                  <th className="py-2">{t('Мин. порог')}</th>
                </tr>
              </thead>
              <tbody>
                {regionsDraft.map((r, i) => (
                  <tr key={r.id} className="border-b border-[#f1ebf7] align-top">
                    <td className="py-2 pr-3 font-semibold text-[#320066]">{r.name}</td>
                    <td className="py-2 pr-3 text-[#5f5768]">{r.cities.join(', ')}</td>
                    <td className="py-2 pr-3">
                      <input
                        value={r.aliases.join(', ')}
                        onChange={(e) => {
                          const v = [...regionsDraft]
                          v[i] = { ...r, aliases: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }
                          setRegionsDraft(v)
                        }}
                        className="w-full rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
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
                        className="w-28 rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#e9e0f2] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#ffa400]">{t('Шаг 1–2')}</div>
              <h2 className="mb-1 text-xl font-extrabold text-[#320066]">{t('Загрузка и автоматическая сверка')}</h2>
              <p className="text-sm text-[#6b6472]">
                {t('Статистика считается по 7 регионам. Поддерживаются файлы с')} <strong>{t('Регионом/Городом')}</strong> {t('и форматы из «Общего Кампуса».')}
              </p>
            </div>
            <div className="flex rounded-full border border-[#e9e0f2] bg-[#faf7fd] p-1 text-sm">
              <button onClick={() => setMode('single')} className={`rounded-full px-3.5 py-1.5 font-semibold transition ${mode === 'single' ? 'bg-[#4c008e] text-white' : 'text-[#5f5768] hover:text-[#320066]'}`}>{t('Единый файл')}</button>
              <button onClick={() => setMode('pair')} className={`rounded-full px-3.5 py-1.5 font-semibold transition ${mode === 'pair' ? 'bg-[#4c008e] text-white' : 'text-[#5f5768] hover:text-[#320066]'}`}>{t('Сверка 2 файлов')}</button>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e9e0f2] bg-[#faf7fd] p-4">
              <div className="mb-1 font-semibold text-[#320066]">{t('Шаблон: база приложения (конкурс)')}</div>
              <div className="mb-3 text-sm text-[#6b6472]">{t('Колонки: ID заявки на ФГ, Регион, Город, Фамилия, Имя, Номер телефона, Роль, ГК, Участие в акциях, Участие на рейде, Участие в кейсе.')}</div>
              <a href="/templates/template-app-base.xlsx" download className="inline-flex rounded-full bg-[#4c008e] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#320066]">{t('Скачать .xlsx')}</a>
            </div>
            <div className="rounded-xl border border-[#e9e0f2] bg-[#faf7fd] p-4">
              <div className="mb-1 font-semibold text-[#320066]">{t('Шаблон: списки от регионов (А/С)')}</div>
              <div className="mb-3 text-sm text-[#6b6472]">{t('Колонки: Регион, Город, Фамилия, Имя, Номер телефона, Telegram (при наличии). Город маппится в регион автоматически.')}</div>
              <a href="/templates/template-region-lists.xlsx" download className="inline-flex rounded-full bg-[#4c008e] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#320066]">{t('Скачать .xlsx')}</a>
            </div>
          </div>

          {mode === 'single' ? (
            <div className="grid gap-4">
              <Drop
                title={t('Единая база (рекомендуется для непрерывного обновления)')}
                hint={t('Один файл: Регион/Город, Фамилия, Имя, Телефон, показатели (ГК/акции/рейд/кейс/роль). Подходит для шаблона конкурса и файлов из «Общего Кампуса».')}
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
              <Drop title={t('Зона 1: Эталонная база из приложения')} hint={t('Excel/CSV: Регион, Город, Фамилия, Имя, Номер телефона, показатели/статусы')} name={appName} onFile={(f) => onFile(f, 'app')} />
              <Drop title={t('Зона 2: Списки от регионов (А/С)')} hint={t('Excel/CSV: Регион, Город, Фамилия, Имя, Номер телефона / Telegram')} name={regionName} onFile={(f) => onFile(f, 'region')} />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={runReconcile} className="rounded-full bg-[#4c008e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#320066]">{t('Рассчитать / Сверить')}</button>
            <span className="text-sm text-[#6b6472]">{t('Нормализация, маппинг город→регион, дедупликация — автоматически. Режим «Единый файл» агрегирует статистику напрямую.')}</span>
          </div>
        </section>

        {summary && (
          <section className="rounded-[1.5rem] border border-amber-200/70 bg-gradient-to-b from-white to-[#fff1d6]/30 p-5 shadow-sm ring-1 ring-amber-100 sm:p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#ffa400]">{t('Шаг 3')}</div>
            <h2 className="mb-4 text-xl font-extrabold text-[#320066]">{t('Предпросмотр и публикация (снепшот)')}</h2>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Mini label={t('Было Активистов')} value={summary.prevActivists} />
              <Mini label={t('Станет Активистов')} value={summary.nextActivists} accent />
              <Mini label={t('Дельта')} value={`${summary.delta >= 0 ? '+' : ''}${summary.delta}`} />
              <Mini label={t('Отсеяно')} value={summary.rejected} warn />
              <Mini label={t('Не распознан регион')} value={summary.unrecognized} warn={summary.unrecognized > 0} />
            </div>
            {summary.unrecognized > 0 && (
              <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-3.5 text-sm text-orange-800">
                <div className="font-semibold">{t('Обнаружены записи без распознанного региона')} ({summary.unrecognized})</div>
                <div className="mt-1 text-orange-700">
                  {t('Проверьте колонку «Регион/Город» в исходном файле или добавьте алиасы в справочнике регионов выше. Примеры:')}{' '}
                  {summary.records.filter((r) => r.regionId === 'unknown').slice(0, 5).map((r) => `${r.fullName || '—'} (${r.city || t('без города')})`).join('; ') || '—'}
                </div>
              </div>
            )}
            {summary.records.length === 0 && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
                {t('Не удалось сформировать записи из файла. Проверьте, что в файле есть строки с данными (не только заголовки) и колонки: Регион/Город, Фамилия, Имя, Номер телефона.')}
              </div>
            )}
            {publishedFlash && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm font-semibold text-amber-700 animate-pop">
                {t('✓ Снепшот опубликован — дашборд обновлён, дельты пересчитаны. Продолжайте цикл до достижения целевых показателей.')}
              </div>
            )}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('Комментарий, напр. «Срез пятница 18:00»')}
                className="w-full min-w-0 flex-1 rounded-xl border border-[#e9e0f2] px-3.5 py-3 text-sm outline-none focus:border-[#ffa400]/50 focus:ring-4 focus:ring-[#ffa400]/10 sm:min-w-[260px]"
              />
              <button onClick={publish} className="w-full rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-amber-600 sm:w-auto sm:py-2.5">{t('Опубликовать обновление')}</button>
              <button onClick={downloadErrors} className="w-full rounded-full border border-[#d9cde8] px-5 py-3 text-sm font-semibold text-[#4c008e] hover:bg-[#f5eefb] sm:w-auto sm:py-2.5">{t('Скачать отчёт по ошибкам (Excel)')}</button>
            </div>

            <div className="mt-6 border-t border-[#e9e0f2] pt-5">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-[#320066]">{t('Записи людей')}</h3>
                  <p className="text-sm text-[#6b6472]">{t('Можно изменить ФИО, регион, город, статус или причину перед публикацией.')}</p>
                </div>
                <input
                  value={recordFilter}
                  onChange={(e) => { setRecordFilter(e.target.value); setRecordLimit(100) }}
                  placeholder={t('Поиск по ФИО / региону / городу')}
                  className="w-full rounded-xl border border-[#e9e0f2] px-3.5 py-2.5 text-sm outline-none focus:border-[#ffa400]/50 focus:ring-4 focus:ring-[#ffa400]/10 sm:w-80"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e9e0f2] text-xs uppercase tracking-wide text-[#6b6472]">
                      <th className="py-2 pr-3">{t('ФИО')}</th>
                      <th className="py-2 pr-3">{t('Регион')}</th>
                      <th className="py-2 pr-3">{t('Город')}</th>
                      <th className="py-2 pr-3">{t('Статус')}</th>
                      <th className="py-2">{t('Причина')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.slice(0, recordLimit).map(({ r, idx }) => (
                        <tr key={r.personKey + '-' + idx} className="border-b border-[#f1ebf7] align-top">
                          <td className="py-2 pr-3">
                            <input
                              value={r.fullName}
                              onChange={(e) => updateRecord(idx, { fullName: e.target.value })}
                              className="w-full rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <select
                              value={r.regionId}
                              onChange={(e) => updateRecord(idx, { regionId: e.target.value })}
                              className="w-full rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
                            >
                              <option value="unknown">{t('Не распознан')}</option>
                              {regionsDraft.map((reg) => <option key={reg.id} value={reg.id}>{reg.name}</option>)}
                            </select>
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              value={r.city}
                              onChange={(e) => updateRecord(idx, { city: e.target.value })}
                              className="w-full rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <select
                              value={r.status}
                              onChange={(e) => {
                                const status = e.target.value as RecordStatus
                                updateRecord(idx, { status, rejectReason: status === 'VALID_ACTIVIST' ? undefined : (r.rejectReason || '') })
                              }}
                              className="w-full rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
                            >
                              <option value="VALID_ACTIVIST">{t('Подтверждённый новичок')}</option>
                              <option value="IN_PROGRESS">{t('В процессе')}</option>
                              <option value="NOT_IN_APP">{t('Нет в приложении')}</option>
                              <option value="DUPLICATE">{t('Дубликат')}</option>
                            </select>
                          </td>
                          <td className="py-2">
                            <input
                              value={r.rejectReason || ''}
                              onChange={(e) => updateRecord(idx, { rejectReason: e.target.value || undefined })}
                              placeholder={r.status === 'VALID_ACTIVIST' ? '—' : t('Причина')}
                              className="w-full rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {filteredRecords.length > recordLimit && (
                <div className="mt-3 flex items-center gap-3">
                  <button onClick={() => setRecordLimit((n) => n + 100)} className="rounded-full border border-[#d9cde8] px-4 py-2 text-sm font-semibold text-[#4c008e] hover:bg-[#f5eefb]">
                    {t('Показать ещё')}
                  </button>
                  <span className="text-sm text-[#6b6472]">{Math.min(recordLimit, filteredRecords.length)} / {filteredRecords.length}</span>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="rounded-[1.5rem] border border-[#e9e0f2] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#ffa400]">{t('Участники')}</div>
              <h2 className="text-xl font-extrabold text-[#320066]">{t('Все участники (опубликованный снепшот)')}</h2>
              <p className="text-sm text-[#6b6472]">
                {published ? `${publishedRecords.length} ${t('записей')}` : t('Нет опубликованного снепшота')}
                {publishedDirty && <span className="ml-2 font-semibold text-amber-600">• {t('Есть несохранённые изменения')}</span>}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <input
                value={publishedFilter}
                onChange={(e) => { setPublishedFilter(e.target.value); setPublishedLimit(100) }}
                placeholder={t('Поиск по ФИО / региону / городу')}
                className="w-full rounded-xl border border-[#e9e0f2] px-3.5 py-2.5 text-sm outline-none focus:border-[#ffa400]/50 focus:ring-4 focus:ring-[#ffa400]/10 sm:w-80"
              />
              <button onClick={savePublishedRecords} disabled={!publishedDirty} className="rounded-full bg-[#4c008e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#320066] disabled:cursor-not-allowed disabled:opacity-40">{t('Сохранить')}</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e9e0f2] text-xs uppercase tracking-wide text-[#6b6472]">
                  <th className="py-2 pr-3">{t('ФИО')}</th>
                  <th className="py-2 pr-3">{t('Регион')}</th>
                  <th className="py-2 pr-3">{t('Город')}</th>
                  <th className="py-2 pr-3">{t('Статус')}</th>
                  <th className="py-2">{t('Причина')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPublishedRecords.slice(0, publishedLimit).map(({ r, idx }) => (
                  <tr key={(r.personKey || r.fullName) + '-' + idx} className="border-b border-[#f1ebf7] align-top">
                    <td className="py-2 pr-3">
                      <input
                        value={r.fullName}
                        onChange={(e) => updatePublishedRecord(idx, { fullName: e.target.value })}
                        className="w-full rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={r.regionId}
                        onChange={(e) => updatePublishedRecord(idx, { regionId: e.target.value })}
                        className="w-full rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
                      >
                        <option value="unknown">{t('Не распознан')}</option>
                        {regionsDraft.map((reg) => <option key={reg.id} value={reg.id}>{reg.name}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        value={r.city}
                        onChange={(e) => updatePublishedRecord(idx, { city: e.target.value })}
                        className="w-full rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={r.status}
                        onChange={(e) => {
                          const status = e.target.value as RecordStatus
                          updatePublishedRecord(idx, { status, rejectReason: status === 'VALID_ACTIVIST' ? undefined : (r.rejectReason || '') })
                        }}
                        className="w-full rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
                      >
                        <option value="VALID_ACTIVIST">{t('Подтверждённый новичок')}</option>
                        <option value="IN_PROGRESS">{t('В процессе')}</option>
                        <option value="NOT_IN_APP">{t('Нет в приложении')}</option>
                        <option value="DUPLICATE">{t('Дубликат')}</option>
                      </select>
                    </td>
                    <td className="py-2">
                      <input
                        value={r.rejectReason || ''}
                        onChange={(e) => updatePublishedRecord(idx, { rejectReason: e.target.value || undefined })}
                        placeholder={r.status === 'VALID_ACTIVIST' ? '—' : t('Причина')}
                        className="w-full rounded-lg border border-[#e9e0f2] px-2.5 py-1.5 outline-none focus:border-[#ffa400]/50 focus:ring-2 focus:ring-[#ffa400]/10"
                      />
                    </td>
                  </tr>
                ))}
                {filteredPublishedRecords.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-sm text-[#6b6472]">{publishedRecords.length ? t('Ничего не найдено') : t('Нет записей')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredPublishedRecords.length > publishedLimit && (
            <div className="mt-3 flex items-center gap-3">
              <button onClick={() => setPublishedLimit((n) => n + 100)} className="rounded-full border border-[#d9cde8] px-4 py-2 text-sm font-semibold text-[#4c008e] hover:bg-[#f5eefb]">{t('Показать ещё')}</button>
              <span className="text-sm text-[#6b6472]">{Math.min(publishedLimit, filteredPublishedRecords.length)} / {filteredPublishedRecords.length}</span>
            </div>
          )}
        </section>

        <section className="rounded-[1.5rem] border border-[#e9e0f2] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#ffa400]">{t('История')}</div>
              <h2 className="text-xl font-extrabold text-[#320066]">{t('Опубликованные снепшоты')}</h2>
            </div>
            <button onClick={clearSnapshots} className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100">{t('Очистить снепшоты')}</button>
          </div>
          <ul className="space-y-2.5 text-sm">
            {[...state.snapshots].reverse().map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e9e0f2] bg-[#faf7fd] px-3.5 py-2.5">
                <span className="text-[#2b2433]">
                  <span className="font-semibold">{new Date(s.createdAt).toLocaleString(locale)}</span> — {s.comment}{' '}
                  {s.id === state.publishedSnapshotId && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">{t('опубликован')}</span>}
                </span>
                <span className="text-[#6b6472]">{t('Активисты:')} {s.stats.reduce((a, x) => a + x.activistsCount, 0)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {selectedRegion && published && (
        <RegionDetailsModal
          region={selectedRegion}
          snapshot={published}
          onClose={() => setSelectedRegionId(null)}
        />
      )}
    </main>
  )
}

function Drop({ title, hint, name, onFile }: { title: string; hint: string; name: string; onFile: (f: File) => void }) {
  const { t } = useT()
  return (
    <label className="flex cursor-pointer flex-col rounded-2xl border-2 border-dashed border-[#d9cde8] bg-[#faf7fd] p-5 transition hover:border-[#4c008e]/40 hover:bg-[#f5eefb]">
      <span className="mb-1 font-semibold text-[#320066]">{title}</span>
      <span className="mb-3 text-sm text-[#6b6472]">{hint}</span>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
      <span className="mt-auto inline-flex w-fit rounded-full border border-[#d9cde8] bg-white px-3.5 py-2 text-sm font-medium text-[#4c008e]">{t('Выбрать файл')}</span>
      {name && <span className="mt-2 text-xs font-medium text-amber-700">{t('Загружено:')} {name}</span>}
    </label>
  )
}

function Mini({ label, value, accent, warn }: { label: string; value: string | number; accent?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-[#e9e0f2] bg-[#faf7fd] p-3.5">
      <div className="text-xs text-[#6b6472]">{label}</div>
      <div className={`text-2xl font-extrabold ${warn ? 'text-orange-600' : accent ? 'text-amber-700' : 'text-[#4c008e]'}`}>{value}</div>
    </div>
  )
}

function Metric({ label, value, accent, warn }: { label: string; value: string | number; accent?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-[#e9e0f2] bg-white p-3.5">
      <div className="text-xs text-[#6b6472]">{label}</div>
      <div className={`text-2xl font-extrabold ${warn ? 'text-orange-600' : accent ? 'text-amber-700' : 'text-[#4c008e]'}`}>{value}</div>
    </div>
  )
}
