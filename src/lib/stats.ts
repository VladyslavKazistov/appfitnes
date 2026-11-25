import type { Profile, Session, WeightEntry } from '../types'
import { e1rm } from './progression'

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 0 = понедельник */
export const todayWeekday = () => (new Date().getDay() + 6) % 7

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

export function bmi(p: Profile, kg = p.weightKg): number {
  const h = p.heightCm / 100
  return kg / (h * h)
}

const dayNum = (iso: string) => Date.parse(iso.slice(0, 10)) / 86400000

/** Скорость изменения веса, кг в неделю (линейная регрессия за последние `days` дней). */
export function weeklyRate(entries: WeightEntry[], days = 28): number | null {
  if (entries.length < 2) return null
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1))
  const end = dayNum(sorted[sorted.length - 1].date)
  const pts = sorted.filter((e) => end - dayNum(e.date) <= days)
  if (pts.length < 2) return null
  const xs = pts.map((p) => dayNum(p.date))
  const span = xs[xs.length - 1] - xs[0]
  if (span < 6) return null
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length
  const my = pts.reduce((a, p) => a + p.kg, 0) / pts.length
  let num = 0
  let den = 0
  pts.forEach((p, i) => {
    num += (xs[i] - mx) * (p.kg - my)
    den += (xs[i] - mx) ** 2
  })
  return den ? (num / den) * 7 : null
}

/** Подсказка для «массы без лишнего жира»: +0.25…0.5 % веса в неделю. */
export function gainAdvice(rateKgWeek: number | null, currentKg: number): { tone: 'good' | 'warn' | 'info'; text: string } {
  if (rateKgWeek == null) return { tone: 'info', text: 'Взвешивайся 2–3 раза в неделю утром натощак. Через неделю покажу темп набора.' }
  const pct = (rateKgWeek / currentKg) * 100
  const fmt = `${rateKgWeek >= 0 ? '+' : ''}${rateKgWeek.toFixed(2)} кг/нед`
  if (pct < 0.1) return { tone: 'warn', text: `${fmt}: вес почти не растёт. Для массы нужно немного больше еды.` }
  if (pct <= 0.55) return { tone: 'good', text: `${fmt}: отличный темп — масса без лишнего жира.` }
  return { tone: 'warn', text: `${fmt}: быстровато, часть может уходить в жир. Цель — ${(currentKg * 0.0025).toFixed(1)}–${(currentKg * 0.005).toFixed(1)} кг/нед.` }
}

export function bestE1rmSeries(exerciseId: string, sessions: Session[]): { date: string; value: number }[] {
  return sessions
    .filter((s) => s.finishedAt)
    .sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1))
    .flatMap((s) => {
      const log = s.exercises.find((e) => e.exerciseId === exerciseId)
      if (!log) return []
      const vals = log.sets.filter((x) => x.done && x.weight && x.reps).map((x) => e1rm(x.weight!, x.reps!))
      return vals.length ? [{ date: s.startedAt.slice(0, 10), value: Math.round(Math.max(...vals) * 10) / 10 }] : []
    })
}

export function sessionVolume(s: Session): number {
  return s.exercises.reduce((a, e) => a + e.sets.reduce((b, x) => b + (x.done && x.weight && x.reps ? x.weight * x.reps : 0), 0), 0)
}

export function doneSets(s: Session): number {
  return s.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0)
}

export function thisWeekCount(sessions: Session[]): number {
  const now = new Date()
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - todayWeekday()).getTime()
  return sessions.filter((s) => s.finishedAt && Date.parse(s.startedAt) >= monday).length
}

export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
