import { useEffect, useState } from 'react'
import { getExercise } from '../data/exercises'
import { lastReps, suggest } from '../lib/progression'
import { doneSets } from '../lib/stats'
import { useStore } from '../store'
import type { ExerciseLog, Session, SetLog } from '../types'
import { Button, Card, Sheet } from '../components/ui'

function beep() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    ;[0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = 880
      g.gain.setValueAtTime(0.25, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.2)
    })
    navigator.vibrate?.([200, 100, 200])
  } catch {
    /* ignore */
  }
}

function RestTimer({ until, onDone, onAdd }: { until: number; onDone: () => void; onAdd: (s: number) => void }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, Math.ceil((until - now) / 1000))
  useEffect(() => {
    if (left === 0) {
      beep()
      onDone()
    }
  }, [left, onDone])
  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-40 flex items-center justify-between rounded-2xl bg-accent px-4 py-3 text-ink shadow-xl">
      <div>
        <div className="text-xs font-medium opacity-70">Отдых</div>
        <div className="text-2xl font-bold tabular-nums">
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
        </div>
      </div>
      <div className="flex gap-2">
        <button className="rounded-lg bg-black/15 px-3 py-2 text-sm font-semibold" onClick={() => onAdd(30)}>
          +30 с
        </button>
        <button className="rounded-lg bg-black/15 px-3 py-2 text-sm font-semibold" onClick={onDone}>
          Пропустить
        </button>
      </div>
    </div>
  )
}

const num = (v: string): number | null => {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function WorkoutScreen({ onFinish }: { onFinish: (to: 'plan' | 'progress') => void }) {
  const { state, update } = useStore()
  const session = state.active
  const [restUntil, setRestUntil] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<'finish' | 'cancel' | null>(null)

  if (!session) {
    return (
      <div className="pt-20 text-center text-white/50">
        Сейчас нет активной тренировки.
        <Button variant="soft" className="mx-auto mt-4 block" onClick={() => onFinish('plan')}>
          К плану
        </Button>
      </div>
    )
  }

  const day = state.plan?.days.find((d) => d.id === session.dayId)

  const patch = (fn: (s: Session) => Session) => update((st) => (st.active ? { ...st, active: fn(st.active) } : st))
  const setSet = (ei: number, si: number, p: Partial<SetLog>) =>
    patch((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => {
        if (i !== ei) return e
        const sets = e.sets.map((x, j) => (j === si ? { ...x, ...p } : x))
        // Меняешь вес в одном подходе — он подставляется в следующие невыполненные.
        if ('weight' in p) for (let j = si + 1; j < sets.length; j++) if (!sets[j].done) sets[j] = { ...sets[j], weight: p.weight ?? null }
        return { ...e, sets }
      }),
    }))

  const toggleDone = (ei: number, si: number, ex: ExerciseLog, placeholder: number) => {
    const st = ex.sets[si]
    const done = !st.done
    setSet(ei, si, { done, reps: st.reps ?? (done ? placeholder : null) })
    if (done) {
      const rest = day?.exercises.find((pe) => pe.exerciseId === ex.exerciseId)?.restSec ?? 90
      setRestUntil(Date.now() + rest * 1000)
    }
  }

  const total = session.exercises.reduce((a, e) => a + e.sets.length, 0)
  const done = doneSets(session)

  const finish = () => {
    update((st) => ({ ...st, sessions: [...st.sessions, { ...st.active!, finishedAt: new Date().toISOString() }], active: null }))
    setRestUntil(null)
    onFinish('progress')
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold">{session.dayTitle}</h1>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(done / total) * 100}%` }} />
        </div>
        <div className="mt-1 text-xs text-white/50">
          Выполнено подходов: {done} из {total}
        </div>
      </div>

      {session.exercises.map((ex, ei) => {
        const e = getExercise(ex.exerciseId)
        const planned = day?.exercises.find((pe) => pe.exerciseId === ex.exerciseId) ?? { exerciseId: ex.exerciseId, sets: ex.sets.length, repMin: ex.repMin, repMax: ex.repMax, restSec: 90 }
        const sug = suggest(planned, state.sessions)
        const prev = lastReps(planned, state.sessions)
        const weighted = e.load !== 'bodyweight' && e.load !== 'band'
        return (
          <Card key={ei}>
            <div className="font-semibold">{e.name}</div>
            <div className="text-xs text-white/50">
              Цель: {ex.sets.length} × {ex.repMin}–{ex.repMax} {e.timed ? 'сек' : 'повт.'}
            </div>
            <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${sug.kind === 'up' ? 'bg-accent/10 text-accent' : sug.kind === 'down' ? 'bg-amber-400/10 text-amber-300' : 'bg-white/5 text-white/60'}`}>
              {sug.note}
            </div>
            {e.tip && <div className="mt-2 text-xs text-white/40">💡 {e.tip}</div>}

            <div className="mt-3 grid grid-cols-[28px_1fr_1fr_48px] items-center gap-2 text-xs text-white/40">
              <div>#</div>
              <div>{weighted ? 'Вес, кг' : e.load === 'band' ? 'Резинка' : 'Доп. вес'}</div>
              <div>{e.timed ? 'Секунд' : 'Повторы'}</div>
              <div />
            </div>
            {ex.sets.map((s, si) => {
              const placeholder = prev[si] ?? ex.repMin
              return (
                <div key={si} className={`mt-2 grid grid-cols-[28px_1fr_1fr_48px] items-center gap-2 ${s.done ? 'opacity-60' : ''}`}>
                  <div className="text-sm text-white/50">{si + 1}</div>
                  <input
                    inputMode="decimal"
                    placeholder={weighted ? '—' : '0'}
                    className="h-11 w-full min-w-0 rounded-xl bg-white/5 text-center text-lg outline-none ring-1 ring-white/10 focus:ring-accent/60"
                    value={s.weight ?? ''}
                    onChange={(ev) => setSet(ei, si, { weight: num(ev.target.value) })}
                  />
                  <input
                    inputMode="numeric"
                    placeholder={String(placeholder)}
                    className="h-11 w-full min-w-0 rounded-xl bg-white/5 text-center text-lg outline-none ring-1 ring-white/10 placeholder:text-white/25 focus:ring-accent/60"
                    value={s.reps ?? ''}
                    onChange={(ev) => setSet(ei, si, { reps: num(ev.target.value) })}
                  />
                  <button
                    aria-label="Подход выполнен"
                    onClick={() => toggleDone(ei, si, ex, placeholder)}
                    className={`h-11 rounded-xl text-lg font-bold ring-1 transition ${s.done ? 'bg-accent text-ink ring-accent' : 'bg-white/5 text-white/30 ring-white/10'}`}
                  >
                    ✓
                  </button>
                </div>
              )
            })}
            <div className="mt-3 flex gap-2">
              <button
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60"
                onClick={() => patch((ss) => ({ ...ss, exercises: ss.exercises.map((x, i) => (i === ei ? { ...x, sets: [...x.sets, { weight: x.sets.at(-1)?.weight ?? null, reps: null, done: false }] } : x)) }))}
              >
                + подход
              </button>
              {ex.sets.length > 1 && (
                <button
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60"
                  onClick={() => patch((ss) => ({ ...ss, exercises: ss.exercises.map((x, i) => (i === ei ? { ...x, sets: x.sets.slice(0, -1) } : x)) }))}
                >
                  − подход
                </button>
              )}
            </div>
          </Card>
        )
      })}

      <Button className="w-full" onClick={() => setConfirm('finish')}>
        Завершить тренировку
      </Button>
      <Button variant="ghost" className="w-full text-sm" onClick={() => setConfirm('cancel')}>
        Отменить без сохранения
      </Button>

      {restUntil && <RestTimer until={restUntil} onDone={() => setRestUntil(null)} onAdd={(s) => setRestUntil((u) => (u ?? Date.now()) + s * 1000)} />}

      <Sheet open={confirm === 'finish'} onClose={() => setConfirm(null)} title="Завершить тренировку?">
        <p className="mb-4 text-sm text-white/60">
          Выполнено {done} из {total} подходов. Невыполненные подходы не попадут в историю, а следующая тренировка учтёт результат.
        </p>
        <Button className="w-full" onClick={finish}>
          Сохранить
        </Button>
      </Sheet>
      <Sheet open={confirm === 'cancel'} onClose={() => setConfirm(null)} title="Отменить тренировку?">
        <p className="mb-4 text-sm text-white/60">Все отметки этой тренировки удалятся.</p>
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            update((st) => ({ ...st, active: null }))
            setRestUntil(null)
            onFinish('plan')
          }}
        >
          Да, отменить
        </Button>
      </Sheet>
    </div>
  )
}
