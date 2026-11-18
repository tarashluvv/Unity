export type RecordStatus = 'VALID_ACTIVIST' | 'IN_PROGRESS' | 'NOT_IN_APP' | 'DUPLICATE'

export interface Region {
  id: string
  name: string
  aliases: string[]
  cities: string[]
  minThreshold: number
}

export interface CityBreakdown {
  city: string
  fgCount: number
  appCount: number
  examCount: number
  activistsCount: number
  rejectedCount: number
}

export interface VerifiedRecord {
  personKey: string
  fullName: string
  regionId: string
  city: string
  status: RecordStatus
  rejectReason?: string
}

export interface RegionStats {
  regionId: string
  fgCount: number
  appCount: number
  examCount: number
  activistsCount: number
  rejectedCount: number
  deltaActivists: number
  byCity: CityBreakdown[]
}

export interface Snapshot {
  id: string
  createdAt: string
  comment: string
  stats: RegionStats[]
  records: VerifiedRecord[]
}

export interface AppState {
  regions: Region[]
  snapshots: Snapshot[]
  publishedSnapshotId: string | null
}

export interface ReconcileSummary {
  prevActivists: number
  nextActivists: number
  delta: number
  rejected: number
  unrecognized: number
  records: VerifiedRecord[]
  stats: RegionStats[]
}
