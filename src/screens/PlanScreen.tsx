import { useState } from 'react'
import { getExercise, PATTERN_LABEL } from '../data/exercises'
import { alternatives, generatePlan, swapExercise } from '../lib/generator'
import { suggest } from '../lib/progression'
import { thisWeekCount, todayWeekday, WEEKDAYS, WEEKDAYS_FULL } from '../lib/stats'
import { uid, useStore } from '../store'
import type { PlanDay, Session } from '../types'
import { Button, Card, Sheet } from '../components/ui'

export function PlanScreen({ onStart }: { onStart: () => void }) {
  const { state, update } = useStore()
  const plan = state.plan!
  const profile = state.profile!
  const today = todayWeekday()
  const todayDay = plan.days.find((d) => d.weekday === today)
  const nextDay = todayDay ?? [...plan.days].sort((a, b) => ((a.weekday - today + 7) % 7) - ((b.weekday - today + 7) % 7))[0]
  const [openDay, setOpenDay] = useState<string | null>(todayDay?.id ?? null)
  const [swap, setSwap] = useState<{ day: PlanDay; index: number } | null>(null)
  const [confirmRegen, setConfirmRegen] = useState(false)

  const start = (day: PlanDay) => {
    if (state.active) return onStart()
    const session: Session = {
      id: uid(),
      dayId: day.id,
      dayTitle: day.title,
      startedAt: new Date().toISOString(),
      exercises: day.exercises.map((pe) => {
        const s = suggest(pe, state.sessions, state.profile)
        return {
          exerciseId: pe.exerciseId,
          repMin: pe.repMin,
          repMax: pe.repMax,
          sets: Array.from({ length: pe.sets }, () => ({ weight: s.weight, reps: null, done: false })),
        }
      }),
    }
    update((st) => ({ ...st, active: session }))
    onStart()
  }

  const doneThisWeek = thisWeekCount(state.sessions)
  const doneToday = state.sessions.some((s) => s.finishedAt && new Date(s.startedAt).toDateString() === new Date().toDateString())

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-white/50">{WEEKDAYS_FULL[today]}</div>
        <h1 className="text-2xl font-bold">{todayDay ? `Сегодня: ${todayDay.title}` : 'Сегодня отдых'}</h1>
        <div className="mt-1 text-sm text-white/50">
          {plan.splitName} · на этой неделе {doneThisWeek} из {plan.days.length}
        </div>
      </div>

      <div className="flex justify-between gap-1">
        {WEEKDAYS.map((d, i) => {
          const pd = plan.days.find((x) => x.weekday === i)
          return (
            <div key={d} className={`flex-1 rounded-xl py-2 text-center text-xs ring-1 ${i === today ? 'ring-accent/70' : 'ring-white/5'} ${pd ? 'bg-accent/10' : 'bg-white/3'}`}>
              <div className={i === today ? 'text-accent font-semibold' : 'text-white/60'}>{d}</div>
              <div className="mt-0.5 truncate px-0.5 text-[10px] text-white/40">{pd ? pd.title.replace('Всё тело', 'Тело') : '—'}</div>
            </div>
          )
        })}
      </div>

      {state.active ? (
        <Button className="w-full" onClick={onStart}>Продолжить тренировку «{state.active.dayTitle}»</Button>
      ) : doneToday ? (
        <div className="rounded-xl bg-accent/10 px-4 py-3 text-center text-sm text-accent">Тренировка на сегодня выполнена 💪 Отдыхай и восстанавливайся.</div>
      ) : (
        <Button className="w-full" onClick={() => start(nextDay)}>
          {todayDay ? `Начать: ${todayDay.title}` : `Начать сейчас: ${nextDay.title} (${WEEKDAYS[nextDay.weekday]})`}
        </Button>
      )}

      {plan.days.map((day) => {
        const open = openDay === day.id
        return (
          <Card key={day.id} className="p-0">
            <button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setOpenDay(open ? null : day.id)}>
              <div>
                <div className="font-semibold">
                  {WEEKDAYS[day.weekday]} · {day.title}
                </div>
                <div className="text-xs text-white/50">
                  {day.focus} · {day.exercises.length} упр.
                </div>
              </div>
              <span className={`text-white/40 transition ${open ? 'rotate-180' : ''}`}>⌄</span>
            </button>
            {open && (
              <div className="border-t border-white/5 px-4 pb-4">
                {day.exercises.map((pe, i) => {
                  const e = getExercise(pe.exerciseId)
                  return (
                    <div key={i} className="flex items-center justify-between gap-3 border-b border-white/5 py-3 last:border-0">
                      <div className="min-w-0">
                        <div className="text-[15px]">{e.name}</div>
                        <div className="text-xs text-white/50">
                          {pe.sets} × {pe.repMin}–{pe.repMax}
                          {e.timed ? ' сек' : ''} · отдых {Math.round(pe.restSec / 60 * 10) / 10} мин
                        </div>
                      </div>
                      <button className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-white/70" onClick={() => setSwap({ day, index: i })}>
                        Заменить
                      </button>
                    </div>
                  )
                })}
                {!state.active && (
                  <Button variant="soft" className="mt-3 w-full" onClick={() => start(day)}>
                    Начать эту тренировку
                  </Button>
                )}
              </div>
            )}
          </Card>
        )
      })}

      <Button variant="ghost" className="w-full text-sm" onClick={() => setConfirmRegen(true)}>
        Пересобрать план заново
      </Button>

      <Sheet open={!!swap} onClose={() => setSwap(null)} title={swap ? `Замена: ${PATTERN_LABEL[getExercise(swap.day.exercises[swap.index].exerciseId).pattern]}` : ''}>
        {swap &&
          (() => {
            const cur = swap.day.exercises[swap.index].exerciseId
            const alts = alternatives(cur, profile, swap.day.exercises.map((x) => x.exerciseId))
            if (alts.length === 0) return <p className="text-sm text-white/60">С твоим инвентарём замены для этого движения нет. Добавь инвентарь в профиле.</p>
            return (
              <div className="grid gap-2">
                {alts.map((a) => (
                  <button
                    key={a.id}
                    className="rounded-xl bg-white/5 px-4 py-3 text-left ring-1 ring-white/10 active:bg-white/10"
                    onClick={() => {
                      update((st) => ({ ...st, plan: swapExercise(st.plan!, swap.day.id, swap.index, a.id, profile) }))
                      setSwap(null)
                    }}
                  >
                    {a.name}
                    {a.tip && <div className="mt-0.5 text-xs text-white/45">{a.tip}</div>}
                  </button>
                ))}
              </div>
            )
          })()}
      </Sheet>

      <Sheet open={confirmRegen} onClose={() => setConfirmRegen(false)} title="Пересобрать план?">
        <p className="mb-4 text-sm text-white/60">Ручные замены упражнений сбросятся. История и прогресс останутся.</p>
        <Button
          className="w-full"
          onClick={() => {
            update((st) => ({ ...st, plan: generatePlan(st.profile!) }))
            setConfirmRegen(false)
          }}
        >
          Да, пересобрать
        </Button>
      </Sheet>
    </div>
  )
}
