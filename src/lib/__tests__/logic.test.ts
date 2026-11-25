import { describe, expect, it } from 'vitest'
import { generatePlan, alternatives } from '../generator'
import { suggest } from '../progression'
import { weeklyRate, gainAdvice } from '../stats'
import { getExercise } from '../../data/exercises'
import type { Profile, Session } from '../../types'

const base: Profile = { sex: 'male', age: 25, heightCm: 180, weightKg: 70, experience: 'beginner', equipment: [], weekdays: [0, 2, 4], minutes: 60 }

describe('generatePlan', () => {
  for (const [label, eq] of [
    ['bodyweight', []],
    ['home', ['dumbbells', 'pullupBar']],
    ['gym', ['barbell', 'rack', 'bench', 'dumbbells', 'pullupBar', 'dipBars', 'cable', 'machines']],
  ] as const) {
    for (const days of [1, 2, 3, 4, 5, 6]) {
      it(`${label}, ${days} days`, () => {
        const p = { ...base, equipment: [...eq], weekdays: [0, 1, 2, 3, 4, 5].slice(0, days) }
        const plan = generatePlan(p)
        expect(plan.days).toHaveLength(days)
        for (const d of plan.days) {
          expect(d.exercises.length).toBeGreaterThanOrEqual(4)
          expect(d.exercises.length).toBeLessThanOrEqual(7)
          const ids = d.exercises.map((e) => e.exerciseId)
          expect(new Set(ids).size).toBe(ids.length)
          for (const id of ids) for (const n of getExercise(id).needs) expect(p.equipment).toContain(n)
        }
      })
    }
  }
  it('beginner never gets level-3 lifts', () => {
    const plan = generatePlan({ ...base, equipment: ['barbell', 'rack', 'bench'] })
    expect(plan.days.flatMap((d) => d.exercises).every((e) => getExercise(e.exerciseId).level < 3)).toBe(true)
  })
  it('alternatives keep pattern', () => {
    const p = { ...base, equipment: ['dumbbells', 'bench', 'barbell', 'rack'] as Profile['equipment'] }
    const alts = alternatives('bb-bench', p, ['bb-bench'])
    expect(alts.length).toBeGreaterThan(0)
    expect(alts.every((a) => a.pattern === 'hPush')).toBe(true)
  })
})

const sess = (date: string, weight: number, reps: number[]): Session => ({
  id: date, dayId: 'd1', dayTitle: 'x', startedAt: date + 'T10:00:00Z', finishedAt: date + 'T11:00:00Z',
  exercises: [{ exerciseId: 'bb-squat', repMin: 6, repMax: 10, sets: reps.map((r) => ({ weight, reps: r, done: true })) }],
})
const planned = { exerciseId: 'bb-squat', sets: 3, repMin: 6, repMax: 10, restSec: 150 }

describe('progression', () => {
  it('new', () => expect(suggest(planned, []).kind).toBe('new'))
  it('up when all at top', () => expect(suggest(planned, [sess('2026-01-01', 60, [10, 10, 10])])).toMatchObject({ kind: 'up', weight: 62.5 }))
  it('same when in range', () => expect(suggest(planned, [sess('2026-01-01', 60, [10, 9, 8])])).toMatchObject({ kind: 'same', weight: 60 }))
  it('deload after two misses', () =>
    expect(suggest(planned, [sess('2026-01-01', 60, [5, 4, 4]), sess('2026-01-03', 60, [5, 5, 4])])).toMatchObject({ kind: 'down', weight: 54 }))
})

describe('weight rate', () => {
  it('computes kg/week', () => {
    const r = weeklyRate([{ date: '2026-01-01', kg: 70 }, { date: '2026-01-15', kg: 70.6 }])!
    expect(r).toBeCloseTo(0.3, 2)
    expect(gainAdvice(r, 70).tone).toBe('good')
  })
})

describe('home setup: dumbbells 5–25 step 5, bench, short bar', () => {
  const home: Profile = {
    ...base, experience: 'advanced', equipment: ['dumbbells', 'bench', 'barbell', 'mat'],
    dumbbells: { min: 5, max: 25, step: 5 }, bar: { weight: 7, maxPlates: 30, step: 2.5 },
  }
  const dbPlanned = { exerciseId: 'db-bench', sets: 3, repMin: 8, repMax: 15, restSec: 120 }
  const dbSess = (date: string, weight: number, reps: number[]): Session => ({
    id: date, dayId: 'd1', dayTitle: 'x', startedAt: date + 'T10:00:00Z', finishedAt: date + 'T11:00:00Z',
    exercises: [{ exerciseId: 'db-bench', repMin: 8, repMax: 15, sets: reps.map((r) => ({ weight, reps: r, done: true })) }],
  })
  it('jumps to next real dumbbell', () => expect(suggest(dbPlanned, [dbSess('2026-01-01', 15, [15, 15, 15])], home)).toMatchObject({ kind: 'up', weight: 20 }))
  it('at max dumbbell asks for harder variant', () => expect(suggest(dbPlanned, [dbSess('2026-01-01', 25, [15, 15, 15])], home)).toMatchObject({ kind: 'harder', weight: 25 }))
  it('deload snaps to real dumbbell', () =>
    expect(suggest(dbPlanned, [dbSess('2026-01-01', 20, [5, 5, 5]), dbSess('2026-01-03', 20, [6, 5, 5])], home)).toMatchObject({ kind: 'down', weight: 15 }))
  it('plan uses only home equipment and higher reps', () => {
    const plan = generatePlan({ ...home, weekdays: [0, 2, 4, 5] })
    const all = plan.days.flatMap((d) => d.exercises)
    for (const pe of all) for (const n of getExercise(pe.exerciseId).needs) expect(home.equipment).toContain(n)
    expect(all.some((pe) => getExercise(pe.exerciseId).load === 'barbell')).toBe(true)
    expect(all.filter((pe) => getExercise(pe.exerciseId).load === 'dumbbell').every((pe) => pe.repMax >= 15)).toBe(true)
  })
})

describe('migrate old profile', async () => {
  const { migrate, EMPTY } = await import('../storage')
  it('switches to advanced and home equipment', () => {
    const old = { ...EMPTY, profile: { ...base, equipment: ['dumbbells', 'pullupBar', 'bench'] as Profile['equipment'] }, plan: null }
    const st = migrate(old)
    expect(st.profile!.experience).toBe('advanced')
    expect(st.profile!.equipment).toEqual(['dumbbells', 'bench'])
    expect(st.profile!.dumbbells).toEqual({ min: 5, max: 25, step: 5 })
    expect(st.plan).not.toBeNull()
  })
})

describe('muscle-group split', async () => {
  const { regenerateDay } = await import('../generator')
  const home: Profile = {
    ...base, experience: 'advanced', equipment: ['dumbbells', 'bench', 'barbell', 'mat'], weekdays: [0, 2, 4],
    dumbbells: { min: 5, max: 25, step: 5 }, bar: { weight: 7, maxPlates: 30, step: 2.5 }, splitMode: 'groups',
  }
  const plan = generatePlan(home)
  const patterns = (i: number) => plan.days[i].exercises.map((e) => getExercise(e.exerciseId).pattern)
  it('default: chest+biceps / back+triceps / shoulders+legs', () => {
    expect(plan.days.map((d) => d.groups)).toEqual([['chest', 'biceps'], ['back', 'triceps'], ['shoulders', 'legs']])
    expect(plan.days[0].title).toBe('Грудь + Бицепс')
    expect(patterns(0).every((p) => ['hPush', 'chestIso', 'biceps'].includes(p))).toBe(true)
    expect(patterns(0)).toContain('biceps')
    expect(patterns(1).every((p) => ['hPull', 'vPull', 'rearDelt', 'triceps'].includes(p))).toBe(true)
    expect(patterns(2)).toContain('squat')
    expect(patterns(2)).toContain('vPush')
    for (const d of plan.days) expect(d.exercises.length).toBeGreaterThanOrEqual(5)
  })
  it('regenerate keeps groups and equipment', () => {
    let seed = 1
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const p2 = regenerateDay(plan, 'd1', home, undefined, rng)
    expect(p2.days[0].groups).toEqual(['chest', 'biceps'])
    for (const pe of p2.days[0].exercises) for (const n of getExercise(pe.exerciseId).needs) expect(home.equipment).toContain(n)
    expect(p2.days[1]).toBe(plan.days[1])
  })
  it('change groups for one day', () => {
    const p3 = regenerateDay(plan, 'd3', home, ['legs'])
    expect(p3.days[2].title).toBe('Ноги')
    expect(p3.days[2].exercises.every((e) => ['squat', 'hinge', 'lunge', 'hamCurl', 'calves', 'quadIso'].includes(getExercise(e.exerciseId).pattern))).toBe(true)
  })
})

describe('activity payload', async () => {
  const { parsePayload, upsert, lastDays } = await import('../activity')
  it('parses full payload', () => expect(parsePayload('FITPLAN date=2026-11-25 steps=8432 km=6,1')).toEqual({ date: '2026-11-25', steps: 8432, km: 6.1 }))
  it('parses spaces in numbers and units', () => expect(parsePayload('FITPLAN date=2026-11-25 steps=8 432 km=6,12 км', '2026-11-26')).toEqual({ date: '2026-11-25', steps: 8432, km: 6.12 }))
  it('defaults date to today, meters → km', () => expect(parsePayload('fitplan steps=1200 km=950', '2026-11-26')).toEqual({ date: '2026-11-26', steps: 1200, km: 0.95 }))
  it('rejects random clipboard', () => expect(parsePayload('hello 123')).toBeNull())
  it('upsert replaces same day', () => expect(upsert([{ date: '2026-11-25', steps: 1, km: null }], { date: '2026-11-25', steps: 2, km: 1 })).toHaveLength(1))
  it('lastDays fills gaps', () => {
    const d = lastDays([{ date: '2026-11-24', steps: 5, km: null }], 3, '2026-11-25')
    expect(d.map((x) => x.date)).toEqual(['2026-11-23', '2026-11-24', '2026-11-25'])
    expect(d[1].entry?.steps).toBe(5)
  })
})

describe('start weights', async () => {
  const { startWeight } = await import('../startWeights')
  const me: Profile = { ...base, weightKg: 72, experience: 'advanced', equipment: ['dumbbells', 'bench', 'barbell'], dumbbells: { min: 5, max: 25, step: 5 }, bar: { weight: 7, maxPlates: 30, step: 2.5 } }
  it('uses only real dumbbells', () => {
    const w = startWeight({ exerciseId: 'db-bench', sets: 4, repMin: 8, repMax: 15, restSec: 120 }, me)!
    expect([5, 10, 15, 20, 25]).toContain(w)
    expect(w).toBe(25)
  })
  it('bar weight within bar + plates', () => {
    const w = startWeight({ exerciseId: 'bb-curl', sets: 3, repMin: 12, repMax: 20, restSec: 60 }, me)!
    expect(w).toBeGreaterThanOrEqual(7)
    expect(w).toBeLessThanOrEqual(37)
    expect((w - 7) % 2.5).toBe(0)
  })
  it('suggest gives a starting weight', () => expect(suggest({ exerciseId: 'db-curl', sets: 3, repMin: 12, repMax: 20, restSec: 60 }, [], me).weight).toBe(10))
})
