import type { Region } from './types'

export function normalizePhone(raw: unknown): string {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  let d = digits
  if (d.length === 11 && d.startsWith('8')) d = '7' + d.slice(1)
  if (d.length === 10) d = '7' + d
  if (d.length === 11 && d.startsWith('7')) return d
  return d
}

export function normalizeTg(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
}

export function normalizeText(raw: unknown): string {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/қ/g, 'к')
    .replace(/ғ/g, 'г')
    .replace(/ң/g, 'н')
    .replace(/ө/g, 'о')
    .replace(/ұ/g, 'у')
    .replace(/ү/g, 'у')
    .replace(/һ/g, 'х')
    .replace(/і/g, 'и')
    .replace(/ә/g, 'а')
    .replace(/[^a-zа-я0-9\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeName(raw: unknown): string {
  return normalizeText(raw)
}

/**
 * Russian/Kazakh/latin spellings of the same city must be counted once and
 * shown with one canonical label (e.g. "Түркістан" and "Туркестан"
 * both become "Туркестан").
 */
const CITY_ALIASES: Record<string, string> = {
  // capitals
  астана: 'Астана', нурсултан: 'Астана', нусултан: 'Астана',
  алматы: 'Алматы', алмааты: 'Алматы',
  шымкент: 'Шымкент', чимкент: 'Шымкент',
  // south
  кызылорда: 'Кызылорда', кызылордагород: 'Кызылорда',
  туркестан: 'Туркестан', тараз: 'Тараз', талас: 'Талас',
  талдыкорган: 'Талдыкорган',
  // north
  костанай: 'Костанай', кокшетау: 'Кокшетау',
  петропавловск: 'Петропавловск', жезказган: 'Жезказган',
  // west
  актау: 'Актау', атырау: 'Атырау', актобе: 'Актобе',
  уральск: 'Уральск', орал: 'Уральск',
  // east
  караганда: 'Караганда', павлодар: 'Павлодар', семей: 'Семей',
  устькаменогорск: 'Усть-Каменогорск', оскемен: 'Усть-Каменогорск',
  // latin fallbacks
  astana: 'Астана', nursultan: 'Астана', almaty: 'Алматы',
  shymkent: 'Шымкент', kyzylorda: 'Кызылорда', turkistan: 'Туркестан',
  taraz: 'Тараз', kostanay: 'Костанай', kokshetau: 'Кокшетау',
  petropavlovsk: 'Петропавловск', zhezkazgan: 'Жезказган',
  aktau: 'Актау', atyrau: 'Атырау', aktobe: 'Актобе',
  oral: 'Уральск', karaganda: 'Караганда', pavlodar: 'Павлодар',
  semey: 'Семей', oskemen: 'Усть-Каменогорск',
}

const cityKey = (raw: unknown) => normalizeText(raw).replace(/[\s-]/g, '')

/** Canonical display name for a city, regardless of the spelling in the source file. */
export function canonicalCity(raw: unknown): string {
  const key = cityKey(raw)
  if (!key) return 'Не указан'
  const alias = CITY_ALIASES[key]
  if (alias) return alias
  const trimmed = String(raw ?? '').trim()
  return trimmed || 'Не указан'
}

/** Merge a list of city labels (e.g. from old saved snapshots) into canonical ones. */
export function canonicalCityList(cities: string[]): string[] {
  const out: string[] = []
  for (const c of cities) {
    const canonical = canonicalCity(c)
    if (!out.includes(canonical)) out.push(canonical)
  }
  return out
}

export function personKey(phone: string, tg: string, name: string, regionId: string): string {
  if (phone) return 'p:' + phone
  if (tg) return 't:' + tg
  if (name) return 'n:' + name + '|' + regionId
  return 'u:' + Math.random().toString(36).slice(2)
}

function eq(a: string, b: string) {
  if (!a || !b) return false
  if (a === b) return true
  if (a.length > 2 && b.length > 2 && (a.includes(b) || b.includes(a))) return true
  return false
}

export function resolveRegionId(regionRaw: unknown, cityRaw: unknown, regions: Region[]): { regionId: string | null; city: string } {
  const rNorm = normalizeText(regionRaw)
  const cNorm = normalizeText(cityRaw)
  const cityLabel = canonicalCity(cityRaw)

  // 1) explicit region match
  if (rNorm) {
    for (const r of regions) {
      const names = [r.name, ...r.aliases].map(normalizeText)
      if (names.some((n) => n && eq(rNorm, n))) return { regionId: r.id, city: cityLabel }
    }
  }

  // 2) match by city membership
  if (cNorm) {
    for (const r of regions) {
      const cities = [r.name, ...r.cities, ...r.aliases].map(normalizeText)
      if (cities.some((n) => n && eq(cNorm, n))) return { regionId: r.id, city: cityLabel }
    }
  }

  // 3) try region field as city
  if (rNorm) {
    for (const r of regions) {
      const cities = [r.name, ...r.cities, ...r.aliases].map(normalizeText)
      if (cities.some((n) => n && eq(rNorm, n))) return { regionId: r.id, city: canonicalCity(regionRaw) }
    }
  }

  return { regionId: null, city: cityLabel === 'Не указан' ? String(regionRaw ?? '').trim() : cityLabel }
}
