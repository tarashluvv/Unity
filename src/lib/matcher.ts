import { canonicalCity, normalizeName, normalizePhone, normalizeText, normalizeTg, personKey, resolveRegionId } from './normalizer'
import type { CityBreakdown, ReconcileSummary, RecordStatus, Region, RegionStats, VerifiedRecord } from './types'

type Row = Record<string, unknown>

function pick(row: Row, keys: string[]): unknown {
  const norm = (s: string) => normalizeText(s).replace(/\s/g, '')
  const map = new Map<string, unknown>()
  for (const [k, v] of Object.entries(row)) map.set(norm(k), v)
  for (const k of keys) {
    const v = map.get(norm(k))
    if (v !== undefined && v !== null && String(v).trim() !== '') return v
  }
  return undefined
}

function truthy(v: unknown): boolean {
  if (v === true || v === 1) return true
  const s = String(v ?? '').toLowerCase().trim()
  return ['1', 'true', 'yes', 'да', '+', 'ok', 'сдал', 'сдано', 'прошел', 'прошёл', 'активист', 'есть'].some((t) => s === t || s.includes(t))
}

function hasValue(v: unknown): boolean {
  const s = String(v ?? '').trim().toLowerCase()
  return !!s && s !== '-' && s !== '—' && s !== 'нет' && s !== 'no' && s !== '0' && s !== 'жоқ'
}

export interface AppPerson {
  key: string
  phone: string
  tg: string
  name: string
  rawName: string
  regionId: string | null
  city: string
  passedFg: boolean
  passedExam: boolean
}

function fullNameFromRow(r: Row): { raw: string; norm: string } {
  const fio = pick(r, ['фио', 'fullname', 'full_name', 'name', 'имяифамилия'])
  const fam = pick(r, ['фамилия'])
  const imya = pick(r, ['имя'])
  let raw = String(fio ?? '').trim()
  if (!raw) raw = [String(fam ?? '').trim(), String(imya ?? '').trim()].filter(Boolean).join(' ').trim()
  return { raw, norm: normalizeName(raw) }
}

function resolveFromRow(r: Row, regions: Region[]) {
  const regionRaw = pick(r, ['регион', 'region', 'область'])
  const cityRaw = pick(r, ['город', 'city', 'населенныйпункт', 'нп'])
  return resolveRegionId(regionRaw, cityRaw, regions)
}

function detectStages(r: Row) {
  const fg = pick(r, ['фг', 'fg', 'first_meeting', 'статусфг', 'пришелнафг', 'участие_на_фг', 'idзаявкинафг'])
  const exam = pick(r, ['декабрь', 'december', 'exam', 'испытание', 'декабрьское', 'статусдекабрь', 'декабрьскоеиспытание'])
  const roleRaw = String(pick(r, ['роль', 'статус', 'роль2', 'роль2принеобходимости']) ?? '').toLowerCase()
  const gk = pick(r, ['гк'])
  const actions = pick(r, ['участиевакциях'])
  const raid = pick(r, ['участиенарейде', 'колвоучастийврейдах'])
  const casePart = pick(r, ['участиевкейсе', 'колвоучастийвкейсах'])
  const camp = pick(r, ['участиенакэмпе', 'участиенакемпе', 'участиенакэмпе(+/-)', 'участиенакэмпе+-', 'кэмп', 'кемп'])

  const roleActivist = /активист|лидер|лидэр|координатор/.test(roleRaw)
  const rolePretendent = /претендент|кандидат/.test(roleRaw)
  const score = [gk, actions, raid, casePart, camp].filter(hasValue).length
  const campOk = hasValue(camp) && !/^\s*-\s*$/.test(String(camp))

  const explicitExam = truthy(exam)
  const passedExam = explicitExam || roleActivist || (campOk && score >= 1) || score >= 3
  const passedFg = truthy(fg) || hasValue(fg) || hasValue(pick(r, ['idзаявкинафг'])) || hasValue(pick(r, ['дата вступления в движение жа', 'датавступлениявдвижениежа'])) || score > 0 || passedExam || roleActivist || rolePretendent || roleRaw.length > 0
  return { passedFg, passedExam }
}

export function parseAppRows(rows: Row[], regions: Region[]): AppPerson[] {
  return rows
    .filter((r) => Object.values(r).some((v) => String(v ?? '').trim() !== ''))
    .map((r) => {
      const phone = normalizePhone(pick(r, ['телефон', 'phone', 'номер', 'mobile', 'номертелефона']))
      const tg = normalizeTg(pick(r, ['telegram', 'телеграм', 'tg', 'username', 'ник', 'telegramтег']))
      const { raw, norm } = fullNameFromRow(r)
      const { regionId, city } = resolveFromRow(r, regions)
      const { passedFg, passedExam } = detectStages(r)
      const p: AppPerson = { key: '', phone, tg, name: norm, rawName: raw, regionId, city, passedFg, passedExam }
      return { ...p, key: personKey(p.phone, p.tg, p.name, p.regionId || 'unknown') }
    })
    .filter((p) => p.name || p.phone || p.tg)
}

export interface RegionEntry {
  phone: string
  tg: string
  name: string
  rawName: string
  regionId: string | null
  city: string
}

export function parseRegionRows(rows: Row[], regions: Region[]): RegionEntry[] {
  return rows
    .filter((r) => Object.values(r).some((v) => String(v ?? '').trim() !== ''))
    .map((r) => {
      const phone = normalizePhone(pick(r, ['телефон', 'phone', 'номер', 'mobile', 'номертелефона']))
      const tg = normalizeTg(pick(r, ['telegram', 'телеграм', 'tg', 'username', 'ник', 'telegramтег']))
      const { raw, norm } = fullNameFromRow(r)
      const { regionId, city } = resolveFromRow(r, regions)
      return { phone, tg, name: norm, rawName: raw, regionId, city }
    })
    .filter((p) => p.name || p.phone || p.tg)
}

export function aggregateDirect(app: AppPerson[], regions: Region[], prevStats?: RegionStats[]): ReconcileSummary {
  const seen = new Set<string>()
  const records: VerifiedRecord[] = []
  for (const p of app) {
    const regionId = p.regionId || 'unknown'
    const key = p.key || personKey(p.phone, p.tg, p.name, regionId)
    if (seen.has(key)) {
      records.push({ personKey: key, fullName: p.rawName || p.name || '—', regionId, city: p.city || '', status: 'DUPLICATE', rejectReason: 'Дубликат в базе' })
      continue
    }
    seen.add(key)
    let status: RecordStatus = 'IN_PROGRESS'
    let rejectReason: string | undefined = 'На этапе ФГ/ожидания'
    if (p.passedExam) { status = 'VALID_ACTIVIST'; rejectReason = undefined }
    else if (p.passedFg) { status = 'IN_PROGRESS'; rejectReason = 'Не сдал декабрьское испытание' }
    records.push({ personKey: key, fullName: p.rawName || p.name || '—', regionId, city: p.city || '', status, rejectReason })
  }
  const stats: RegionStats[] = regions.map((r) => {
    const rs = records.filter((x) => x.regionId === r.id)
    const activistsCount = rs.filter((x) => x.status === 'VALID_ACTIVIST').length
    const examCount = rs.filter((x) => x.status === 'VALID_ACTIVIST' || x.status === 'IN_PROGRESS').length
    const appCount = rs.filter((x) => x.status !== 'NOT_IN_APP').length
    const fgCount = rs.length
    const rejectedCount = rs.filter((x) => x.status === 'NOT_IN_APP' || x.status === 'DUPLICATE').length
    const prev = prevStats?.find((s) => s.regionId === r.id)?.activistsCount ?? 0
    return { regionId: r.id, fgCount, appCount, examCount, activistsCount, rejectedCount, deltaActivists: activistsCount - prev, byCity: buildCityBreakdown(records, r.id) }
  })
  const nextActivists = stats.reduce((a, s) => a + s.activistsCount, 0)
  const prevActivists = (prevStats || []).reduce((a, s) => a + s.activistsCount, 0)
  const rejected = records.filter((r) => r.status === 'NOT_IN_APP' || r.status === 'DUPLICATE').length
  const unrecognized = records.filter((r) => r.regionId === 'unknown').length
  return { prevActivists, nextActivists, delta: nextActivists - prevActivists, rejected, unrecognized, records, stats }
}

function buildCityBreakdown(records: VerifiedRecord[], regionId: string): CityBreakdown[] {
  const rs = records.filter((r) => r.regionId === regionId)
  const map = new Map<string, VerifiedRecord[]>()
  for (const r of rs) {
    const c = canonicalCity(r.city)
    if (!map.has(c)) map.set(c, [])
    map.get(c)!.push(r)
  }
  return [...map.entries()].map(([city, list]) => ({
    city,
    fgCount: list.length,
    appCount: list.filter((x) => x.status !== 'NOT_IN_APP').length,
    examCount: list.filter((x) => x.status === 'VALID_ACTIVIST' || x.status === 'IN_PROGRESS').length,
    activistsCount: list.filter((x) => x.status === 'VALID_ACTIVIST').length,
    rejectedCount: list.filter((x) => x.status === 'NOT_IN_APP' || x.status === 'DUPLICATE').length,
  })).sort((a, b) => b.activistsCount - a.activistsCount)
}

export function reconcile(app: AppPerson[], entries: RegionEntry[], regions: Region[], prevStats?: RegionStats[]): ReconcileSummary {
  const byPhone = new Map<string, AppPerson>()
  const byTg = new Map<string, AppPerson>()
  const byNameRegion = new Map<string, AppPerson>()
  for (const p of app) {
    if (p.phone) byPhone.set(p.phone, p)
    if (p.tg) byTg.set(p.tg, p)
    if (p.name) byNameRegion.set(p.name + '|' + (p.regionId || 'unknown'), p)
  }

  const claimed = new Set<string>()
  const records: VerifiedRecord[] = []

  for (const e of entries) {
    const regionId = e.regionId || 'unknown'
    const key = personKey(e.phone, e.tg, e.name, regionId)
    let found: AppPerson | undefined
    if (e.phone) found = byPhone.get(e.phone)
    if (!found && e.tg) found = byTg.get(e.tg)
    if (!found && e.name) found = byNameRegion.get(e.name + '|' + regionId)

    let status: RecordStatus
    let rejectReason: string | undefined

    if (claimed.has(key)) {
      status = 'DUPLICATE'
      rejectReason = 'Дубликат в списках'
    } else if (!found) {
      status = 'NOT_IN_APP'
      rejectReason = 'Нет в выгрузке приложения'
    } else {
      const fkey = personKey(found.phone, found.tg, found.name, found.regionId || 'unknown')
      if (claimed.has(fkey)) {
        status = 'DUPLICATE'
        rejectReason = 'Человек уже засчитан за другим регионом/городом'
      } else if (found.passedExam) {
        status = 'VALID_ACTIVIST'
        claimed.add(fkey); claimed.add(key)
      } else if (found.passedFg) {
        status = 'IN_PROGRESS'
        rejectReason = 'Не сдал декабрьское испытание'
        claimed.add(fkey); claimed.add(key)
      } else {
        status = 'IN_PROGRESS'
        rejectReason = 'На этапе ФГ/ожидания'
        claimed.add(fkey); claimed.add(key)
      }
    }

    records.push({ personKey: key, fullName: e.rawName || e.name || '—', regionId, city: e.city || found?.city || '', status, rejectReason })
  }

  const stats: RegionStats[] = regions.map((r) => {
    const rs = records.filter((x) => x.regionId === r.id)
    const activistsCount = rs.filter((x) => x.status === 'VALID_ACTIVIST').length
    const examCount = rs.filter((x) => x.status === 'VALID_ACTIVIST' || x.status === 'IN_PROGRESS').length
    const appCount = rs.filter((x) => x.status !== 'NOT_IN_APP').length
    const fgCount = rs.length
    const rejectedCount = rs.filter((x) => x.status === 'NOT_IN_APP' || x.status === 'DUPLICATE').length
    const prev = prevStats?.find((s) => s.regionId === r.id)?.activistsCount ?? 0
    return { regionId: r.id, fgCount, appCount, examCount, activistsCount, rejectedCount, deltaActivists: activistsCount - prev, byCity: buildCityBreakdown(records, r.id) }
  })

  const nextActivists = stats.reduce((a, s) => a + s.activistsCount, 0)
  const prevActivists = (prevStats || []).reduce((a, s) => a + s.activistsCount, 0)
  const rejected = records.filter((r) => r.status === 'NOT_IN_APP' || r.status === 'DUPLICATE').length
  const unrecognized = records.filter((r) => r.regionId === 'unknown').length
  return { prevActivists, nextActivists, delta: nextActivists - prevActivists, rejected, unrecognized, records, stats }
}
