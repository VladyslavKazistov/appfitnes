export type Equipment =
  | 'barbell'
  | 'rack'
  | 'bench'
  | 'dumbbells'
  | 'kettlebell'
  | 'pullupBar'
  | 'dipBars'
  | 'bands'
  | 'cable'
  | 'machines'
  | 'mat'

export type Experience = 'beginner' | 'intermediate' | 'advanced'
export type Sex = 'male' | 'female'

export type Pattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'hPush'
  | 'vPush'
  | 'hPull'
  | 'vPull'
  | 'chestIso'
  | 'sideDelt'
  | 'rearDelt'
  | 'biceps'
  | 'triceps'
  | 'hamCurl'
  | 'quadIso'
  | 'calves'
  | 'core'

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core'

export type Load = 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'bodyweight' | 'band'

export interface Exercise {
  id: string
  name: string
  pattern: Pattern
  /** Всё это оборудование нужно одновременно. Пустой массив = только вес тела. */
  needs: Equipment[]
  load: Load
  compound: boolean
  /** 1 = просто, 3 = сложно технически */
  level: 1 | 2 | 3
  /** Упражнение на время (секунды), а не на повторы */
  timed?: boolean
  tip?: string
}

export interface Profile {
  name?: string
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  experience: Experience
  equipment: Equipment[]
  /** Дни недели: 0 = пн … 6 = вс */
  weekdays: number[]
  minutes: number
  /** Наборные гантели: вес одной гантели */
  dumbbells?: { min: number; max: number; step: number }
  /** Гриф с блинами */
  bar?: { weight: number; maxPlates: number; step: number }
  /** auto — сплит подбирается сам; groups — свои группы мышц на каждый день */
  splitMode?: 'auto' | 'groups'
  /** Группы мышц по дню недели (0 = пн) */
  dayGroups?: Record<number, MuscleGroup[]>
  /** Цель по шагам в день */
  stepGoal?: number
}

export interface PlannedExercise {
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  restSec: number
  /** Базовое упражнение дня: больше подходов, меньше повторов */
  main?: boolean
}

export interface PlanDay {
  id: string
  title: string
  focus: string
  weekday: number
  groups?: MuscleGroup[]
  exercises: PlannedExercise[]
}

export interface Plan {
  createdAt: string
  splitName: string
  days: PlanDay[]
}

export interface SetLog {
  weight: number | null
  reps: number | null
  done: boolean
}

export interface ExerciseLog {
  exerciseId: string
  repMin: number
  repMax: number
  sets: SetLog[]
}

export interface Session {
  id: string
  dayId: string
  dayTitle: string
  startedAt: string
  finishedAt?: string
  exercises: ExerciseLog[]
}

export interface WeightEntry {
  date: string // YYYY-MM-DD
  kg: number
}

export interface ActivityEntry {
  date: string // YYYY-MM-DD
  steps: number
  km: number | null
}

export interface AppState {
  version: 1
  profile: Profile | null
  plan: Plan | null
  sessions: Session[]
  active: Session | null
  bodyWeight: WeightEntry[]
  activity: ActivityEntry[]
}
