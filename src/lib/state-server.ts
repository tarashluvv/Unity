import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getInitialState, normalizeState } from './data'
import type { AppState } from './types'

function dataFilePath(): string {
  return process.env.DATA_FILE || path.join(process.cwd(), 'data', 'camp-race-state.json')
}

export async function readState(): Promise<AppState> {
  const file = dataFilePath()
  try {
    const raw = await readFile(/* turbopackIgnore: true */ file, 'utf8')
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || !Array.isArray(parsed.regions) || !Array.isArray(parsed.snapshots)) {
      return getInitialState()
    }
    return normalizeState(parsed)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ENOENT') {
      return getInitialState()
    }
    console.error('Failed to read state file:', err)
    return getInitialState()
  }
}

export async function writeState(state: AppState): Promise<void> {
  const file = dataFilePath()
  const dir = path.dirname(file)
  await mkdir(/* turbopackIgnore: true */ dir, { recursive: true })
  const normalized = normalizeState(state)
  const tmp = file + '.' + process.pid + '.' + Date.now() + '.tmp'
  await writeFile(/* turbopackIgnore: true */ tmp, JSON.stringify(normalized), 'utf8')
  await rename(/* turbopackIgnore: true */ tmp, file)
}

export function sanitizeStateForPublic(state: AppState): AppState {
  return {
    ...state,
    snapshots: state.snapshots.map((s) => ({ ...s, records: [] })),
  }
}
