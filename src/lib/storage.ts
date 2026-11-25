import { get, set } from 'idb-keyval'
import type { AppState } from '../types'
import { EQUIPMENT } from '../data/exercises'
import { generatePlan } from './generator'
import { DEFAULT_BAR, DEFAULT_DUMBBELLS } from './weights'

const KEY = 'fitplan-state'

export const EMPTY: AppState = { version: 1, profile: null, plan: null, sessions: [], active: null, bodyWeight: [] }

/** v0.1 → v0.2: опыт «опытный», только домашний инвентарь, веса гантелей и грифа. */
export function migrate(st: AppState): AppState {
  const p = st.profile
  if (!p || p.dumbbells) return st
  const allowed = EQUIPMENT.map((e) => e.id)
  const profile = { ...p, experience: 'advanced' as const, equipment: p.equipment.filter((e) => allowed.includes(e)), dumbbells: DEFAULT_DUMBBELLS, bar: DEFAULT_BAR }
  return { ...st, profile, plan: generatePlan(profile) }
}

export async function load(): Promise<AppState> {
  try {
    const v = (await get(KEY)) as AppState | undefined
    if (v) return migrate({ ...EMPTY, ...v })
  } catch {
    /* IndexedDB недоступен — пробуем localStorage */
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return migrate({ ...EMPTY, ...JSON.parse(raw) })
  } catch {
    /* ignore */
  }
  return EMPTY
}

export async function save(state: AppState): Promise<void> {
  try {
    await set(KEY, state)
    return
  } catch {
    /* fallthrough */
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

export async function requestPersistence(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    /* ignore */
  }
}

export function exportJson(state: AppState): string {
  return JSON.stringify({ app: 'fitplan', exportedAt: new Date().toISOString(), state }, null, 2)
}

export function parseImport(text: string): AppState {
  const data = JSON.parse(text)
  const st = data?.state ?? data
  if (!st || typeof st !== 'object' || !Array.isArray(st.sessions)) throw new Error('Это не файл FitPlan')
  return migrate({ ...EMPTY, ...st, active: null })
}
