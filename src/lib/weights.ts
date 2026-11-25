import type { Load, Profile } from '../types'

export const DEFAULT_DUMBBELLS = { min: 5, max: 25, step: 5 }
export const DEFAULT_BAR = { weight: 7, maxPlates: 30, step: 2.5 }

const range = (from: number, to: number, step: number) => {
  const out: number[] = []
  if (step <= 0) return out
  for (let w = from; w <= to + 1e-9; w += step) out.push(Math.round(w * 100) / 100)
  return out
}

/** Какие веса реально можно поставить (для гантелей — вес одной гантели). null = любой. */
export function availableWeights(load: Load, profile?: Profile | null): number[] | null {
  if (!profile) return null
  if (load === 'dumbbell') {
    const d = profile.dumbbells ?? DEFAULT_DUMBBELLS
    return range(d.min, d.max, d.step)
  }
  if (load === 'barbell') {
    const b = profile.bar ?? DEFAULT_BAR
    return range(b.weight, b.weight + b.maxPlates, b.step)
  }
  return null
}

/** Максимальная суммарная нагрузка: обе гантели / гриф с блинами. */
export function capacity(profile: Profile) {
  const d = profile.dumbbells ?? DEFAULT_DUMBBELLS
  const b = profile.bar ?? DEFAULT_BAR
  return {
    dumbbell: profile.equipment.includes('dumbbells') ? d.max * 2 : 0,
    barbell: profile.equipment.includes('barbell') ? b.weight + b.maxPlates : 0,
  }
}

/** Домашний инвентарь с ограниченным весом: для роста мышц уходим в бо́льшие повторы. */
export function isLightLoad(profile: Profile): boolean {
  if (profile.equipment.includes('machines') || profile.equipment.includes('cable')) return false
  const c = capacity(profile)
  return Math.max(c.dumbbell, c.barbell) < 70
}

export function nextUp(w: number, list: number[]): number | null {
  return list.find((x) => x > w + 1e-9) ?? null
}

export function snapDown(w: number, list: number[]): number {
  const below = list.filter((x) => x <= w + 1e-9)
  return below.length ? below[below.length - 1] : list[0]
}
