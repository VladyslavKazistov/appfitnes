import { getExercise } from '../data/exercises'
import type { ExerciseLog, Load, PlannedExercise, Session } from '../types'

export interface Suggestion {
  weight: number | null
  note: string
  kind: 'new' | 'up' | 'same' | 'down' | 'harder'
}

const STEP: Record<Load, number> = { barbell: 2.5, dumbbell: 2, kettlebell: 4, machine: 5, bodyweight: 0, band: 0 }

export const round = (x: number, to = 0.5) => Math.round(x / to) * to

export function step(load: Load, weight: number): number {
  const s = STEP[load]
  if (load === 'dumbbell' && weight < 10) return 1
  if (load === 'machine' && weight < 30) return 2.5
  return s
}

/** Последние логи упражнения из завершённых тренировок, от новых к старым. */
export function history(exerciseId: string, sessions: Session[]): ExerciseLog[] {
  return sessions
    .filter((s) => s.finishedAt)
    .sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1))
    .flatMap((s) => s.exercises.filter((e) => e.exerciseId === exerciseId && e.sets.some((x) => x.done)))
}

function workingWeight(log: ExerciseLog): number | null {
  const ws = log.sets.filter((s) => s.done && s.weight != null).map((s) => s.weight as number)
  return ws.length ? Math.max(...ws) : null
}

function hitTop(log: ExerciseLog, plannedSets: number): boolean {
  const done = log.sets.filter((s) => s.done)
  return done.length >= plannedSets && done.every((s) => (s.reps ?? 0) >= log.repMax)
}

function missed(log: ExerciseLog): boolean {
  const done = log.sets.filter((s) => s.done)
  return done.length === 0 || done.filter((s) => (s.reps ?? 0) < log.repMin).length >= 2
}

/** Двойная прогрессия: сначала добираем повторы до верхней границы, потом добавляем вес. */
export function suggest(planned: PlannedExercise, sessions: Session[]): Suggestion {
  const e = getExercise(planned.exerciseId)
  const logs = history(planned.exerciseId, sessions)
  const unit = e.timed ? 'сек' : 'повт.'
  if (logs.length === 0) {
    if (e.load === 'bodyweight' || e.load === 'band')
      return { weight: null, kind: 'new', note: `Первый раз: делай ${planned.repMin}–${planned.repMax} ${unit}, оставляя 1–2 в запасе.` }
    return { weight: null, kind: 'new', note: 'Первый раз: подбери вес, при котором последние 2 повтора даются тяжело, но технично.' }
  }
  const last = logs[0]
  const w = workingWeight(last)
  const noWeight = e.load === 'bodyweight' || e.load === 'band' || w == null || w === 0

  if (hitTop(last, planned.sets)) {
    if (noWeight)
      return { weight: w, kind: 'harder', note: `Все подходы на ${planned.repMax}+ — пора усложнить: медленнее темп, пауза внизу, рюкзак с весом или вариант посложнее.` }
    const nw = round(w! + step(e.load, w!))
    return { weight: nw, kind: 'up', note: `В прошлый раз всё выполнено — добавляем вес: ${w} → ${nw} кг.` }
  }
  if (missed(last) && logs[1] && missed(logs[1]) && !noWeight) {
    const nw = round(w! * 0.9)
    return { weight: nw, kind: 'down', note: `Две тренировки подряд не дотягиваешь до ${planned.repMin} — разгрузка: ${nw} кг, и снова вверх.` }
  }
  return {
    weight: w,
    kind: 'same',
    note: noWeight
      ? `Цель — на 1 ${unit === 'сек' ? 'секунду больше' : 'повтор больше'}, чем в прошлый раз, в каждом подходе.`
      : `Тот же вес ${w} кг, постарайся добавить по повтору (цель ${planned.repMax}).`,
  }
}

export function lastReps(planned: PlannedExercise, sessions: Session[]): (number | null)[] {
  const log = history(planned.exerciseId, sessions)[0]
  return log ? log.sets.map((s) => s.reps) : []
}

/** Оценка разового максимума (Эпли). */
export const e1rm = (w: number, r: number) => (r <= 1 ? w : w * (1 + r / 30))
