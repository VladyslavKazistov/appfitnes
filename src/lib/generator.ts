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
  // На пресс важнее разнообразие, чем отягощение: все варианты равноценны.
  let s = e.pattern === 'core' ? 3 : LOAD_RANK[e.load]
  if (e.pattern === 'vPull' && e.id.startsWith('pull')) s += 1 // подтягивания — король вертикальной тяги
  if (e.pattern === 'vPull' && !e.compound) s -= 2
  if (e.id === 'db-floor-press' || e.id.endsWith('goblet-squat')) s -= 1 // запасные варианты, если нет скамьи / штанги
  if (e.id === 'db-floor-press' && profile.equipment.includes('bench')) s -= 3 // со скамьёй жим с пола не нужен
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

/** По умолчанию в каждом упражнении 4 подхода; меняются только повторы и отдых. */
export const DEFAULT_SETS = 4

export function prescription(e: Exercise, isMain: boolean, _experience: Experience, light = false): Omit<PlannedExercise, 'exerciseId'> {
  const sets = DEFAULT_SETS
  const main = isMain && e.compound
  const m = main ? { main: true } : {}
  if (e.pattern === 'core') return e.timed ? { sets, repMin: 20, repMax: 45, restSec: 45 } : { sets, repMin: 12, repMax: 20, restSec: 45 }
  if (e.timed) return { sets, repMin: 20, repMax: 45, restSec: 60 }
  if (e.load === 'band') return { sets, repMin: 12, repMax: 20, restSec: 60 }
  if (e.load === 'bodyweight') return e.compound ? { sets, repMin: 6, repMax: 15, restSec: 90 } : { sets, repMin: 10, repMax: 20, restSec: 60 }
  if (light && (e.load === 'dumbbell' || e.load === 'barbell' || e.load === 'kettlebell')) {
    // Вес ограничен — растим мышцы за счёт повторов, доводя подходы почти до отказа.
    if (main) return { sets, repMin: 8, repMax: 15, restSec: 120, ...m }
    if (e.compound) return { sets, repMin: 10, repMax: 15, restSec: 90 }
    return { sets, repMin: 12, repMax: 20, restSec: 60 }
  }
  if (main) return { sets, repMin: 6, repMax: 10, restSec: 150, ...m }
  if (e.compound) return { sets, repMin: 8, repMax: 12, restSec: 120 }
  return { sets, repMin: 10, repMax: 15, restSec: 75 }
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
]
/** Пресс не выбирается: он добавляется в каждый тренировочный день автоматически. */
export const GROUP_LABEL = { ...Object.fromEntries(GROUPS.map((g) => [g.id, g.label])), core: 'Пресс' } as Record<MuscleGroup, string>

/** Движения для каждой группы в порядке важности (берутся первые N, что нашлись). */
const GROUP_SLOTS: Record<MuscleGroup, Pattern[]> = {
  chest: ['hPush', 'hPush', 'chestIso', 'hPush', 'chestIso'],
  back: ['hPull', 'vPull', 'hPull', 'rearDelt', 'hPull'],
  shoulders: ['vPush', 'sideDelt', 'rearDelt', 'sideDelt', 'vPush'],
  legs: ['squat', 'hinge', 'lunge', 'hamCurl', 'calves', 'quadIso'],
  biceps: ['biceps', 'biceps', 'biceps'],
  triceps: ['triceps', 'triceps', 'triceps'],
  core: ['core', 'core', 'core', 'core'],
}

/** Сколько упражнений на группу за тренировку. */
export const GROUP_COUNT: Record<MuscleGroup, number> = { chest: 3, back: 3, shoulders: 3, legs: 3, biceps: 2, triceps: 2, core: 3 }
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

export const groupsTitle = (groups: MuscleGroup[]) => (groups.length ? groups.filter((g) => g !== 'core').map((g) => GROUP_LABEL[g]).join(' + ') || 'Пресс' : 'Без групп')

/** Детерминированный генератор случайных чисел: одна и та же неделя → тот же план. */
export function seededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Понедельник текущей недели, YYYY-MM-DD — ключ недели. */
export function weekKey(d = new Date()): string {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`
}

interface BuildOpts {
  /** Случайный выбор среди почти равноценных; без него — всегда лучшие. */
  rng?: () => number
  /** Упражнения, которых стараемся избежать (были на прошлой неделе / в прошлой версии дня). */
  avoid?: string[]
}

/**
 * Собирает тренировку под выбранные группы: фиксированное число упражнений на группу
 * и 3 упражнения на пресс между блоками.
 */
export function buildGroupDay(groups: MuscleGroup[], profile: Profile, weekday: number, id: string, opts: BuildOpts = {}): PlanDay {
  const { rng, avoid = [] } = opts
  const light = isLightLoad(profile)
  const muscle = groups.filter((g) => g !== 'core').sort((a, b) => Number(BIG.includes(b)) - Number(BIG.includes(a)))
  const used: string[] = []

  const pickFor = (g: MuscleGroup): PlannedExercise[] => {
    const out: PlannedExercise[] = []
    for (const pattern of GROUP_SLOTS[g]) {
      if (out.length >= GROUP_COUNT[g]) break
      const list = candidates(pattern, profile, used)
      if (!list.length) continue
      const best = score(list[0], profile)
      // Базовое (первое) упражнение крупной группы выбираем только из лучших.
      const isMain = out.length === 0 && BIG.includes(g)
      const tol = !rng ? 0 : isMain ? 1 : 1.5
      let pool = list.filter((e) => score(e, profile) >= best - tol)
      const fresh = pool.filter((e) => !avoid.includes(e.id))
      if (fresh.length) pool = fresh
      const pick = rng ? pool[Math.floor(rng() * pool.length)] : pool[0]
      used.push(pick.id)
      out.push({ exerciseId: pick.id, ...prescription(pick, isMain, profile.experience, light) })
    }
    return out
  }

  const blocks = muscle.map(pickFor)
  const core = pickFor('core')
  // Пресс ставим между блоками групп (после первой группы), а если группа одна — в конец.
  const exercises = blocks.length > 1 ? [...blocks[0], ...core, ...blocks.slice(1).flat()] : [...blocks.flat(), ...core]
  return { id, title: groupsTitle(groups), focus: '', weekday, groups: muscle.length ? muscle : groups, exercises }
}

export function generateGroupPlan(profile: Profile, prev?: Plan | null, key = weekKey()): Plan {
  const weekdays = [...profile.weekdays].sort((a, b) => a - b)
  const dayGroups = { ...defaultDayGroups(weekdays), ...(profile.dayGroups ?? {}) }
  const days = weekdays.map((wd, i) => {
    const before = prev?.days.find((d) => d.weekday === wd)
    return buildGroupDay(dayGroups[wd] ?? [], profile, wd, `d${i + 1}`, {
      rng: seededRng(`${key}:${wd}`),
      avoid: before?.exercises.map((e) => e.exerciseId) ?? [],
    })
  })
  return { createdAt: new Date().toISOString(), splitName: 'По группам мышц', days, weekKey: key }
}

/** Новая неделя → новая подборка упражнений, по возможности без повторов с прошлой. */
export function rotateWeekIfNeeded(plan: Plan | null, profile: Profile | null, key = weekKey()): Plan | null {
  if (!plan || !profile || profile.splitMode !== 'groups' || plan.weekKey === key) return plan
  return generateGroupPlan(profile, plan, key)
}

/** Пересобрать один день (новые группы и/или новые упражнения). */
export function regenerateDay(plan: Plan, dayId: string, profile: Profile, groups?: MuscleGroup[], rng?: () => number): Plan {
  return {
    ...plan,
    days: plan.days.map((d) =>
      d.id === dayId
        ? buildGroupDay(groups ?? d.groups ?? [], profile, d.weekday, d.id, { rng: rng ?? seededRng(`${plan.weekKey ?? ''}:${d.weekday}:${(groups ?? []).join()}`), avoid: rng ? d.exercises.map((e) => e.exerciseId) : [] })
        : d,
    ),
  }
}
