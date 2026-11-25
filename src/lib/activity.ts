import type { ActivityEntry } from '../types'
import { todayISO } from './stats'

/** Метка, по которой приложение узнаёт данные из команды iOS. */
export const MARKER = 'FITPLAN'

const num = (raw: string | undefined): number | null => {
  if (!raw) return null
  // «8 432», «8 432», «6,1 км», «6.1» → число
  const cleaned = raw.replace(/[\s  ]/g, '').replace(',', '.').match(/-?\d+(\.\d+)?/)
  return cleaned ? parseFloat(cleaned[0]) : null
}

/**
 * Разбирает текст из команды: «FITPLAN date=2026-11-25 steps=8432 km=6,1».
 * Порядок полей любой, дата необязательна (тогда — сегодня).
 */
export function parsePayload(text: string, today = todayISO()): ActivityEntry | null {
  if (!text || !text.toUpperCase().includes(MARKER)) return null
  const field = (name: string) => {
    const m = text.match(new RegExp(`${name}\\s*[=:]\\s*([^=:]*?)(?=\\s+[a-zA-Zа-яА-Я]+\\s*[=:]|$)`, 'i'))
    return m?.[1]?.trim()
  }
  const steps = num(field('steps'))
  if (steps == null || steps < 0) return null
  let km = num(field('km'))
  if (km != null && km > 300) km = km / 1000 // пришли метры
  const d = field('date')?.match(/\d{4}-\d{2}-\d{2}/)?.[0]
  return { date: d ?? today, steps: Math.round(steps), km: km == null ? null : Math.round(km * 100) / 100 }
}

export function upsert(list: ActivityEntry[], e: ActivityEntry): ActivityEntry[] {
  return [...list.filter((x) => x.date !== e.date), e].sort((a, b) => (a.date < b.date ? -1 : 1))
}

/** Последние n дней (включая сегодня), пустые дни — null. */
export function lastDays(list: ActivityEntry[], n: number, today = todayISO()): { date: string; entry: ActivityEntry | null }[] {
  const base = new Date(today + 'T12:00:00')
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() - (n - 1 - i))
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { date: iso, entry: list.find((x) => x.date === iso) ?? null }
  })
}
