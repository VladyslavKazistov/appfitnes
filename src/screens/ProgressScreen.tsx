import { useMemo, useState } from 'react'
import { getExercise } from '../data/exercises'
import { bestE1rmSeries, bmi, doneSets, formatDate, gainAdvice, sessionVolume, thisWeekCount, todayISO, weeklyRate } from '../lib/stats'
import { useStore } from '../store'
import { Button, Card, Label, Sheet, Stepper } from '../components/ui'
import { LineChart } from '../components/LineChart'

export function ProgressScreen() {
  const { state, update } = useStore()
  const profile = state.profile!
  const bw = [...state.bodyWeight].sort((a, b) => (a.date < b.date ? -1 : 1))
  const current = bw.at(-1)?.kg ?? profile.weightKg
  const [kg, setKg] = useState(current)
  const [openSession, setOpenSession] = useState<string | null>(null)
  const [delId, setDelId] = useState<string | null>(null)

  const finished = useMemo(() => state.sessions.filter((s) => s.finishedAt).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)), [state.sessions])
  const trackedIds = useMemo(() => {
    const ids = new Set<string>()
    finished.forEach((s) => s.exercises.forEach((e) => e.sets.some((x) => x.done && x.weight) && ids.add(e.exerciseId)))
    return [...ids]
  }, [finished])
  const [exId, setExId] = useState<string>('')
  const selected = exId || trackedIds[0] || ''
  const series = selected ? bestE1rmSeries(selected, state.sessions) : []

  const rate = weeklyRate(bw)
  const advice = gainAdvice(rate, current)
  const start = bw[0]?.kg

  const addWeight = () => {
    const date = todayISO()
    update((st) => ({
      ...st,
      bodyWeight: [...st.bodyWeight.filter((e) => e.date !== date), { date, kg }],
      profile: st.profile ? { ...st.profile, weightKg: kg } : st.profile,
    }))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Прогресс</h1>

      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="text-xs text-white/50">Тренировок</div>
          <div className="text-xl font-bold">{finished.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-white/50">На неделе</div>
          <div className="text-xl font-bold">{thisWeekCount(state.sessions)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-white/50">ИМТ</div>
          <div className="text-xl font-bold">{bmi(profile, current).toFixed(1)}</div>
        </Card>
      </div>

      <Card>
        <div className="flex items-baseline justify-between">
          <Label>Вес тела</Label>
          {start != null && bw.length > 1 && (
            <span className="text-xs text-white/50">
              с начала: {current - start >= 0 ? '+' : ''}
              {(current - start).toFixed(1)} кг
            </span>
          )}
        </div>
        <LineChart data={bw.map((e) => ({ date: e.date, value: e.kg }))} unit="кг" />
        <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${advice.tone === 'good' ? 'bg-accent/10 text-accent' : advice.tone === 'warn' ? 'bg-amber-400/10 text-amber-300' : 'bg-white/5 text-white/60'}`}>
          {advice.text}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Stepper value={kg} onChange={setKg} step={0.1} min={30} max={250} suffix="кг" />
          <Button className="px-3 py-2.5" onClick={addWeight}>
            Записать
          </Button>
        </div>
      </Card>

      <Card>
        <Label>Сила по упражнениям (расчётный максимум на 1 повтор)</Label>
        {trackedIds.length === 0 ? (
          <div className="py-6 text-center text-sm text-white/40">Появится после первой тренировки с весами</div>
        ) : (
          <>
            <select
              className="mb-2 w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none ring-1 ring-white/10"
              value={selected}
              onChange={(e) => setExId(e.target.value)}
            >
              {trackedIds.map((id) => (
                <option key={id} value={id}>
                  {getExercise(id).name}
                </option>
              ))}
            </select>
            <LineChart data={series} unit="кг" />
          </>
        )}
      </Card>

      <Card>
        <Label>История</Label>
        {finished.length === 0 && <div className="py-4 text-center text-sm text-white/40">Пока пусто</div>}
        {finished.map((s) => {
          const open = openSession === s.id
          const mins = s.finishedAt ? Math.round((Date.parse(s.finishedAt) - Date.parse(s.startedAt)) / 60000) : 0
          return (
            <div key={s.id} className="border-b border-white/5 py-3 last:border-0">
              <button className="flex w-full justify-between text-left" onClick={() => setOpenSession(open ? null : s.id)}>
                <div>
                  <div className="text-[15px]">{s.dayTitle}</div>
                  <div className="text-xs text-white/50">
                    {formatDate(s.startedAt)} · {mins} мин · {doneSets(s)} подх. · {Math.round(sessionVolume(s))} кг объём
                  </div>
                </div>
                <span className="text-white/40">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <div className="mt-2 space-y-1.5">
                  {s.exercises.map((e, i) => {
                    const sets = e.sets.filter((x) => x.done)
                    if (!sets.length) return null
                    return (
                      <div key={i} className="text-xs">
                        <span className="text-white/80">{getExercise(e.exerciseId).name}: </span>
                        <span className="text-white/50">{sets.map((x) => (x.weight ? `${x.weight}×${x.reps}` : `${x.reps}`)).join(', ')}</span>
                      </div>
                    )
                  })}
                  <button className="mt-1 text-xs text-red-300/80" onClick={() => setDelId(s.id)}>
                    Удалить тренировку
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </Card>

      <Sheet open={!!delId} onClose={() => setDelId(null)} title="Удалить тренировку из истории?">
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            update((st) => ({ ...st, sessions: st.sessions.filter((x) => x.id !== delId) }))
            setDelId(null)
          }}
        >
          Удалить
        </Button>
      </Sheet>
    </div>
  )
}
