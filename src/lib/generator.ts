import { EXERCISES, getExercise } from '../data/exercises'
import type { Equipment, Exercise, Experience, Load, Pattern, Plan, PlanDay, PlannedExercise, Profile } from '../types'
import { capacity, isLightLoad } from './weights'

type Template = { title: string; focus: string; slots: Pattern[] }

const T: Record<string, Template> = {
  fbA: { title: 'Всё тело A', focus: 'Присед, жим, тяга', slots: ['squat', 'hPush', 'hPull', 'hinge', 'vPush', 'biceps', 'triceps', 'vPull', 'sideDelt', 'core'] },
  fbB: { title: 'Всё тело B', focus: 'Тяга, жим вверх, спина', slots: ['hinge', 'vPush', 'vPull', 'lunge', 'hPush', 'triceps', 'biceps', 'hPull', 'sideDelt', 'calves'] },
  fbC: { title: 'Всё тело C', focus: 'Ноги, грудь, руки', slots: ['squat', 'hPush', 'vPull', 'lunge', 'hPull', 'biceps', 'triceps', 'rearDelt', 'core'] },
  upper: { title: 'Верх', focus: 'Грудь, спина, плечи, руки', slots: ['hPush', 'hPull', 'vPush', 'vPull', 'sideDelt', 'biceps', 'triceps', 'chestIso', 'rearDelt'] },
  lower: { title: 'Низ', focus: 'Ноги, ягодицы, кор', slots: ['squat', 'hinge', 'lunge', 'hamCurl', 'calves', 'quadIso', 'core'] },
  push: { title: 'Жим', focus: 'Грудь, плечи, трицепс', slots: ['hPush', 'vPush', 'chestIso', 'sideDelt', 'triceps', 'hPush', 'triceps'] },
  pull: { title: 'Тяга', focus: 'Спина, задняя дельта, бицепс', slots: ['vPull', 'hPull', 'rearDelt', 'biceps', 'hPull', 'biceps', 'core'] },
  legs: { title: 'Ноги', focus: 'Квадрицепс, бицепс бедра, икры', slots: ['squat', 'hinge', 'lunge', 'hamCurl', 'quadIso', 'calves', 'core'] },
}

const SPLITS: Record<number, { name: string; days: string[] }> = {
  1: { name: 'Всё тело', days: ['fbA'] },
  2: { name: 'Всё тело A/B', days: ['fbA', 'fbB'] },
  3: { name: 'Всё тело A/B/C', days: ['fbA', 'fbB', 'fbC'] },
  4: { name: 'Верх / Низ', days: ['upper', 'lower', 'upper', 'lower'] },
  5: { name: 'Верх / Низ + Жим / Тяга / Ноги', days: ['upper', 'lower', 'push', 'pull', 'legs'] },
  6: { name: 'Жим / Тяга / Ноги ×2', days: ['push', 'pull', 'legs', 'push', 'pull', 'legs'] },
  7: { name: 'Жим / Тяга / Ноги ×2', days: ['push', 'pull', 'legs', 'push', 'pull', 'legs'] },
}

/** Для набора массы приоритет у того, что легче всего прогрессирует по весу. */
const LOAD_RANK: Record<Load, number> = { barbell: 6, machine: 5, dumbbell: 5.5, kettlebell: 3, bodyweight: 2.5, band: 1.5 }

export function exercisesPerSession(minutes: number): number {
  if (minutes <= 30) return 4
  if (minutes <= 45) return 5
  if (minutes <= 60) return 6
  if (minutes <= 75) return 7
  return 8
}

export function isAvailable(e: Exercise, equipment: Equipment[]): boolean {
  return e.needs.every((n) => equipment.includes(n))
}

type Ctx = Pick<Profile, 'equipment' | 'experience'> & Partial<Profile>

function score(e: Exercise, profile: Ctx): number {
  let s = LOAD_RANK[e.load]
  if (e.pattern === 'vPull' && e.id.startsWith('pull')) s += 1 // подтягивания — король вертикальной тяги
  if (e.pattern === 'vPull' && !e.compound) s -= 2
  if (e.id === 'db-floor-press' || e.id.endsWith('goblet-squat')) s -= 1 // запасные варианты, если нет скамьи / штанги
  if (profile.experience === 'beginner') {
    if (e.level === 3) s -= 100
    if (e.level === 2) s -= 1
  }
  if (profile.heightCm) {
    const p = profile as Profile
    const cap = capacity(p)
    // Лёгкий гриф хорош для рук, а в базовых движениях гантели дают больше веса.
    if (e.load === 'barbell' && e.compound && cap.barbell < cap.dumbbell) s -= 1
    // С лёгкими весами упражнения на одну ногу нагружают мышцы сильнее.
    if (isLightLoad(p) && (e.id === 'db-sl-rdl' || e.id === 'db-split-squat')) s += 1
  }
  return s
}

export function candidates(pattern: Pattern, profile: Ctx, exclude: string[] = []): Exercise[] {
  return EXERCISES.filter((e) => e.pattern === pattern && isAvailable(e, profile.equipment) && !exclude.includes(e.id))
    .map((e) => ({ e, s: score(e, profile) }))
    .filter((x) => x.s > -50)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.e)
}

export function prescription(e: Exercise, slotIndex: number, experience: Experience, light = false): Omit<PlannedExercise, 'exerciseId'> {
  const main = slotIndex < 2 && e.compound
  if (e.timed) return { sets: 3, repMin: 20, repMax: 45, restSec: 60 }
  if (e.load === 'band') return { sets: 3, repMin: 12, repMax: 20, restSec: 60 }
  if (e.load === 'bodyweight') {
    return e.compound
      ? { sets: experience === 'beginner' ? 3 : 4, repMin: 6, repMax: 15, restSec: 90 }
      : { sets: 3, repMin: 10, repMax: 20, restSec: 60 }
  }
  if (light && (e.load === 'dumbbell' || e.load === 'barbell' || e.load === 'kettlebell')) {
    // Вес ограничен — растим мышцы за счёт повторов, доводя подходы почти до отказа.
    if (main) return { sets: experience === 'beginner' ? 3 : 4, repMin: 8, repMax: 15, restSec: 120 }
    if (e.compound) return { sets: 3, repMin: 10, repMax: 15, restSec: 90 }
    return { sets: 3, repMin: 12, repMax: 20, restSec: 60 }
  }
  if (main) return { sets: experience === 'beginner' ? 3 : 4, repMin: 6, repMax: 10, restSec: 150 }
  if (e.compound) return { sets: 3, repMin: 8, repMax: 12, restSec: 120 }
  return { sets: 3, repMin: 10, repMax: 15, restSec: 75 }
}

function buildDay(tplKey: string, variant: number, profile: Profile, weekday: number, idx: number): PlanDay {
  const tpl = T[tplKey]
  // С лёгкими весами отдых короче, поэтому за то же время помещается на одно упражнение больше.
  const limit = exercisesPerSession(profile.minutes) + (isLightLoad(profile) ? 1 : 0)
  const used: string[] = []
  const exercises: PlannedExercise[] = []
  for (const pattern of tpl.slots) {
    if (exercises.length >= limit) break
    const list = candidates(pattern, profile, used)
    if (list.length === 0) continue
    // Чередуем упражнения между одинаковыми днями (Верх 1 / Верх 2), но только среди почти равноценных.
    const best = score(list[0], profile)
    const pool = list.filter((e) => score(e, profile) >= best - 0.75 && e.compound === list[0].compound).slice(0, 2)
    const pick = pool[variant % pool.length]
    used.push(pick.id)
    exercises.push({ exerciseId: pick.id, ...prescription(pick, exercises.length, profile.experience, isLightLoad(profile)) })
  }
  return {
    id: `d${idx + 1}`,
    title: variant > 0 && !tplKey.startsWith('fb') ? `${tpl.title} ${variant + 1}` : tpl.title,
    focus: tpl.focus,
    weekday,
    exercises,
  }
}

export function generatePlan(profile: Profile): Plan {
  const weekdays = [...profile.weekdays].sort((a, b) => a - b)
  const count = Math.max(1, Math.min(7, weekdays.length || 3))
  const split = SPLITS[count]
  const seen: Record<string, number> = {}
  const days = split.days.map((key, i) => {
    const variant = seen[key] ?? 0
    seen[key] = variant + 1
    return buildDay(key, variant, profile, weekdays[i] ?? i, i)
  })
  return { createdAt: new Date().toISOString(), splitName: split.name, days }
}

/** Варианты замены упражнения в плане (то же движение, доступный инвентарь). */
export function alternatives(exerciseId: string, profile: Profile, dayExerciseIds: string[]): Exercise[] {
  const e = getExercise(exerciseId)
  return candidates(e.pattern, profile, dayExerciseIds.filter((id) => id !== exerciseId)).filter((x) => x.id !== exerciseId)
}

export function swapExercise(plan: Plan, dayId: string, index: number, newId: string, profile: Profile): Plan {
  return {
    ...plan,
    days: plan.days.map((d) => {
      if (d.id !== dayId) return d
      const exercises = d.exercises.map((pe, i) => {
        if (i !== index) return pe
        const e = getExercise(newId)
        return { exerciseId: newId, ...prescription(e, i, profile.experience, isLightLoad(profile)) }
      })
      return { ...d, exercises }
    }),
  }
}
