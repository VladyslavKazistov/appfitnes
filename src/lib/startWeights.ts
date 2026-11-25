import { getExercise } from '../data/exercises'
import type { PlannedExercise, Profile } from '../types'
import { availableWeights } from './weights'

/**
 * Рабочий вес на ~10–12 повторов для опытного мужчины, в долях от веса тела.
 * Для гантелей — вес ОДНОЙ гантели, для грифа/штанги — общий вес с грифом.
 * Это стартовая оценка: дальше вес ведёт прогрессия по истории тренировок.
 */
const RATIO: Record<string, number> = {
  // гантели
  'db-bench': 0.36, 'db-incline': 0.3, 'db-floor-press': 0.33, 'db-fly': 0.16,
  'db-ohp': 0.24, 'db-arnold': 0.2, 'db-lateral': 0.1, 'db-rear-fly': 0.09, 'db-upright-row': 0.14,
  'db-row': 0.4, 'db-chest-row': 0.3, 'db-pullover': 0.3,
  'db-curl': 0.17, 'hammer-curl': 0.19, 'db-incline-curl': 0.14, 'db-oh-ext': 0.3,
  'goblet-squat': 0.45, 'db-rdl': 0.4, 'db-sl-rdl': 0.3, 'db-split-squat': 0.25, 'db-lunge': 0.28,
  'db-step-up': 0.25, 'db-calf': 0.4, 'db-leg-curl': 0.15,
  // гриф / штанга
  'bb-curl': 0.45, 'bb-reverse-curl': 0.3, 'bb-skull': 0.4, 'bb-close-press': 0.75,
  'bb-row': 0.8, 'bb-rdl': 1.1, 'bb-ohp': 0.55, 'bb-bench': 1.0, 'bb-squat': 1.2, 'bb-deadlift': 1.5,
  // гиря
  'kb-goblet-squat': 0.4, 'kb-swing': 0.3, 'kb-press': 0.22, 'kb-row': 0.35,
}

const EXP = { beginner: 0.6, intermediate: 0.8, advanced: 1 }

export function startWeight(pe: PlannedExercise, profile?: Profile | null): number | null {
  if (!profile) return null
  const r = RATIO[pe.exerciseId]
  if (r == null) return null
  const e = getExercise(pe.exerciseId)
  let w = profile.weightKg * r * EXP[profile.experience]
  if (profile.sex === 'female') w *= 0.6
  if (profile.age >= 50) w *= 0.85
  if (pe.repMin >= 12) w *= 0.85 // лёгкие многоповторные подходы
  else if (pe.repMax <= 8) w *= 1.1
  const list = availableWeights(e.load, profile)
  // Ближайший реально доступный вес (при равенстве — более лёгкий).
  if (list && list.length) return list.reduce((best, x) => (Math.abs(x - w) < Math.abs(best - w) ? x : best), list[0])
  return Math.max(1, Math.round(w / 2.5) * 2.5)
}
