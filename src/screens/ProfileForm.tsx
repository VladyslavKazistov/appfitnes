import { useState } from 'react'
import { EQUIPMENT } from '../data/exercises'
import type { Equipment, Experience, Profile } from '../types'
import { WEEKDAYS } from '../lib/stats'
import { Button, Card, Chip, Label, Stepper } from '../components/ui'

const DEFAULT: Profile = {
  sex: 'male',
  age: 25,
  heightCm: 178,
  weightKg: 72,
  experience: 'beginner',
  equipment: ['dumbbells', 'pullupBar'],
  weekdays: [0, 2, 4],
  minutes: 60,
}

const PRESETS: { label: string; eq: Equipment[] }[] = [
  { label: 'Ничего (только вес тела)', eq: [] },
  { label: 'Дом: гантели + турник', eq: ['dumbbells', 'pullupBar'] },
  { label: 'Полный зал', eq: ['barbell', 'rack', 'bench', 'dumbbells', 'pullupBar', 'dipBars', 'cable', 'machines'] },
]

const EXP: { id: Experience; label: string; hint: string }[] = [
  { id: 'beginner', label: 'Новичок', hint: 'меньше 6 месяцев регулярных тренировок' },
  { id: 'intermediate', label: 'Средний', hint: '6 месяцев – 2 года' },
  { id: 'advanced', label: 'Опытный', hint: 'больше 2 лет' },
]

export function ProfileForm({ initial, onSave, submitLabel }: { initial?: Profile | null; onSave: (p: Profile) => void; submitLabel: string }) {
  const [p, setP] = useState<Profile>(initial ?? DEFAULT)
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }))
  const toggleEq = (id: Equipment) => set('equipment', p.equipment.includes(id) ? p.equipment.filter((e) => e !== id) : [...p.equipment, id])
  const toggleDay = (d: number) => set('weekdays', p.weekdays.includes(d) ? p.weekdays.filter((x) => x !== d) : [...p.weekdays, d].sort())

  return (
    <div className="space-y-4">
      <Card>
        <Label>Пол</Label>
        <div className="flex gap-2">
          <Chip active={p.sex === 'male'} onClick={() => set('sex', 'male')}>Мужской</Chip>
          <Chip active={p.sex === 'female'} onClick={() => set('sex', 'female')}>Женский</Chip>
        </div>
        <div className="mt-4 grid gap-4">
          <div className="flex items-center justify-between">
            <span>Возраст</span>
            <Stepper value={p.age} onChange={(v) => set('age', v)} min={12} max={90} />
          </div>
          <div className="flex items-center justify-between">
            <span>Рост, см</span>
            <Stepper value={p.heightCm} onChange={(v) => set('heightCm', v)} min={120} max={230} />
          </div>
          <div className="flex items-center justify-between">
            <span>Вес, кг</span>
            <Stepper value={p.weightKg} onChange={(v) => set('weightKg', v)} step={0.5} min={30} max={250} />
          </div>
        </div>
      </Card>

      <Card>
        <Label>Опыт тренировок</Label>
        <div className="grid gap-2">
          {EXP.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => set('experience', e.id)}
              className={`rounded-xl px-4 py-3 text-left ring-1 transition ${p.experience === e.id ? 'bg-accent/15 ring-accent/50' : 'bg-white/5 ring-white/10'}`}
            >
              <div className={p.experience === e.id ? 'text-accent font-medium' : ''}>{e.label}</div>
              <div className="text-xs text-white/50">{e.hint}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <Label>Инвентарь</Label>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((pr) => (
            <button key={pr.label} type="button" onClick={() => set('equipment', pr.eq)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60 ring-1 ring-white/10">
              {pr.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT.map((e) => (
            <Chip key={e.id} active={p.equipment.includes(e.id)} onClick={() => toggleEq(e.id)}>
              {e.label}
            </Chip>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/40">Если ничего не выбрано, план будет на весе тела.</p>
      </Card>

      <Card>
        <Label>Дни тренировок</Label>
        <div className="flex justify-between gap-1">
          {WEEKDAYS.map((d, i) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(i)}
              className={`h-11 flex-1 rounded-xl text-sm ring-1 transition ${p.weekdays.includes(i) ? 'bg-accent text-ink font-semibold ring-accent' : 'bg-white/5 text-white/60 ring-white/10'}`}
            >
              {d}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-white/40">Для массы оптимально 3–4 дня, между тренировками одной мышцы — минимум день отдыха.</p>
        <div className="mt-4 flex items-center justify-between">
          <span>Минут на тренировку</span>
          <Stepper value={p.minutes} onChange={(v) => set('minutes', v)} step={15} min={30} max={120} />
        </div>
      </Card>

      <Button className="w-full" disabled={p.weekdays.length === 0} onClick={() => onSave(p)}>
        {submitLabel}
      </Button>
    </div>
  )
}
