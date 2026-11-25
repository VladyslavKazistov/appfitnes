import { EXERCISES, getExercise } from '../data/exercises'
import type { Equipment, Exercise, Experience, Load, MuscleGroup, Pattern, Plan, PlanDay, PlannedExercise, Profile } from '../types'
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

export function prescription(e: Exercise, isMain: boolean, experience: Experience, light = false): Omit<PlannedExercise, 'exerciseId'> {
  const main = isMain && e.compound
  if (e.timed) return { sets: 3, repMin: 20, repMax: 45, restSec: 60 }
  if (e.load === 'band') return { sets: 3, repMin: 12, repMax: 20, restSec: 60 }
  if (e.load === 'bodyweight') {
    return e.compound
      ? { sets: experience === 'beginner' ? 3 : 4, repMin: 6, repMax: 15, restSec: 90 }
      : { sets: 3, repMin: 10, repMax: 20, restSec: 60 }
  }
  if (light && (e.load === 'dumbbell' || e.load === 'barbell' || e.load === 'kettlebell')) {
    // Вес ограничен — растим мышцы за счёт повторов, доводя подходы почти до отказа.
    if (main) return { sets: experience === 'beginner' ? 3 : 4, repMin: 8, repMax: 15, restSec: 120, main: true }
    if (e.compound) return { sets: 3, repMin: 10, repMax: 15, restSec: 90 }
    return { sets: 3, repMin: 12, repMax: 20, restSec: 60 }
  }
  if (main) return { sets: experience === 'beginner' ? 3 : 4, repMin: 6, repMax: 10, restSec: 150, main: true }
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
    exercises.push({ exerciseId: pick.id, ...prescription(pick, exercises.length < 2, profile.experience, isLightLoad(profile)) })
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
  if (profile.splitMode === 'groups') return generateGroupPlan(profile)
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
        return { exerciseId: newId, ...prescription(e, pe.main ?? i < 2, profile.experience, isLightLoad(profile)) }
      })
      return { ...d, exercises }
    }),
  }
}

// ── Сплит по группам мышц ─────────────────────────────────────────────

export const GROUPS: { id: MuscleGroup; label: string }[] = [
  { id: 'chest', label: 'Грудь' },
  { id: 'back', label: 'Спина' },
  { id: 'shoulders', label: 'Плечи' },
  { id: 'legs', label: 'Ноги' },
  { id: 'biceps', label: 'Бицепс' },
  { id: 'triceps', label: 'Трицепс' },
  { id: 'core', label: 'Пресс' },
]
export const GROUP_LABEL = Object.fromEntries(GROUPS.map((g) => [g.id, g.label])) as Record<MuscleGroup, string>

/** Движения для каждой группы в порядке важности. */
const GROUP_SLOTS: Record<MuscleGroup, Pattern[]> = {
  chest: ['hPush', 'hPush', 'chestIso', 'hPush', 'chestIso'],
  back: ['hPull', 'vPull', 'hPull', 'rearDelt', 'hPull'],
  shoulders: ['vPush', 'sideDelt', 'rearDelt', 'sideDelt', 'vPush'],
  legs: ['squat', 'hinge', 'lunge', 'hamCurl', 'calves', 'lunge', 'quadIso'],
  biceps: ['biceps', 'biceps', 'biceps'],
  triceps: ['triceps', 'triceps', 'triceps'],
  core: ['core', 'core'],
}
const BIG: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs']

/** Схема по умолчанию: грудь+бицепс / спина+трицепс / плечи+ноги, дальше по кругу. */
const DEFAULT_ROTATION: MuscleGroup[][] = [
  ['chest', 'biceps'],
  ['back', 'triceps'],
  ['shoulders', 'legs'],
]

export function defaultDayGroups(weekdays: number[]): Record<number, MuscleGroup[]> {
  const sorted = [...weekdays].sort((a, b) => a - b)
  return Object.fromEntries(sorted.map((wd, i) => [wd, DEFAULT_ROTATION[i % DEFAULT_ROTATION.length]]))
}

export const groupsTitle = (groups: MuscleGroup[]) => (groups.length ? groups.map((g) => GROUP_LABEL[g]).join(' + ') : 'Без групп')

/**
 * Собирает тренировку под выбранные группы. rng — для «сгенерировать заново»:
 * без него берутся лучшие упражнения, с ним — случайные из почти равноценных.
 */
export function buildGroupDay(groups: MuscleGroup[], profile: Profile, weekday: number, id: string, rng?: () => number): PlanDay {
  const light = isLightLoad(profile)
  const limit = exercisesPerSession(profile.minutes) + (light ? 1 : 0)
  const ordered = [...groups].sort((a, b) => Number(BIG.includes(b)) - Number(BIG.includes(a)))
  const used: string[] = []

  // 1. Для каждой группы — упорядоченный список упражнений без повторов.
  const perGroup = ordered.map((g) => {
    const picks: Exercise[] = []
    for (const pattern of GROUP_SLOTS[g]) {
      const list = candidates(pattern, profile, used)
      if (!list.length) continue
      const best = score(list[0], profile)
      // Базовое (первое) упражнение крупной группы выбираем только из лучших.
      const tol = !rng ? 0 : picks.length === 0 && BIG.includes(g) ? 0.75 : 1.5
      const pool = list.filter((e) => score(e, profile) >= best - tol)
      const pick = rng ? pool[Math.floor(rng() * pool.length)] : pool[0]
      used.push(pick.id)
      picks.push(pick)
    }
    return { g, picks }
  })

  // 2. Делим лимит упражнений: крупным группам вдвое больше, чем мелким.
  const weight = (g: MuscleGroup) => (BIG.includes(g) ? 2 : 1)
  const total = perGroup.reduce((a, x) => a + weight(x.g), 0) || 1
  const quota = perGroup.map((x) => Math.min(x.picks.length, Math.max(1, Math.floor((limit * weight(x.g)) / total))))
  let left = limit - quota.reduce((a, b) => a + b, 0)
  while (left > 0) {
    const i = perGroup.findIndex((x, k) => quota[k] < x.picks.length)
    if (i < 0) break
    quota[i]++
    left--
  }

  const exercises: PlannedExercise[] = []
  perGroup.forEach((x, k) =>
    x.picks.slice(0, quota[k]).forEach((e, j) => {
      exercises.push({ exerciseId: e.id, ...prescription(e, j === 0 && BIG.includes(x.g), profile.experience, light) })
    }),
  )
  return { id, title: groupsTitle(groups), focus: '', weekday, groups, exercises }
}

function generateGroupPlan(profile: Profile): Plan {
  const weekdays = [...profile.weekdays].sort((a, b) => a - b)
  const dayGroups = { ...defaultDayGroups(weekdays), ...(profile.dayGroups ?? {}) }
  const days = weekdays.map((wd, i) => buildGroupDay(dayGroups[wd] ?? [], profile, wd, `d${i + 1}`))
  return { createdAt: new Date().toISOString(), splitName: 'По группам мышц', days }
}

/** Пересобрать один день (новые группы и/или новые упражнения). */
export function regenerateDay(plan: Plan, dayId: string, profile: Profile, groups?: MuscleGroup[], rng?: () => number): Plan {
  return {
    ...plan,
    days: plan.days.map((d) => (d.id === dayId ? buildGroupDay(groups ?? d.groups ?? [], profile, d.weekday, d.id, rng) : d)),
  }
}
