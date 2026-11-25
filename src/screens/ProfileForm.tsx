import { useState } from 'react'
import { EQUIPMENT } from '../data/exercises'
import type { Equipment, MuscleGroup, Profile } from '../types'
import { defaultDayGroups, GROUPS } from '../lib/generator'
import { DEFAULT_BAR, DEFAULT_DUMBBELLS } from '../lib/weights'
import { WEEKDAYS, WEEKDAYS_FULL } from '../lib/stats'
import { Button, Card, Chip, Label, Stepper } from '../components/ui'

const DEFAULT: Profile = {
  sex: 'male',
  age: 25,
  heightCm: 178,
  weightKg: 72,
  experience: 'advanced',
  equipment: ['dumbbells', 'bench', 'barbell', 'mat'],
  dumbbells: DEFAULT_DUMBBELLS,
  bar: DEFAULT_BAR,
  splitMode: 'groups',
  dayGroups: defaultDayGroups([0, 2, 4]),
  weekdays: [0, 2, 4],
  minutes: 60,
}

export function ProfileForm({ initial, onSave, submitLabel }: { initial?: Profile | null; onSave: (p: Profile) => void; submitLabel: string }) {
  const [p, setP] = useState<Profile>(initial ? { ...DEFAULT, ...initial, experience: 'advanced' } : DEFAULT)
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }))
  const dumb = p.dumbbells ?? DEFAULT_DUMBBELLS
  const bar = p.bar ?? DEFAULT_BAR
  const toggleEq = (id: Equipment) => set('equipment', p.equipment.includes(id) ? p.equipment.filter((e) => e !== id) : [...p.equipment, id])
  const days = [...p.weekdays].sort((a, b) => a - b)
  const groupsFor = (wd: number): MuscleGroup[] => p.dayGroups?.[wd] ?? defaultDayGroups(days)[wd] ?? []
  const toggleGroup = (wd: number, g: MuscleGroup) => {
    const cur = groupsFor(wd)
    const next = cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]
    if (next.length) set('dayGroups', { ...(p.dayGroups ?? {}), [wd]: next })
  }
  const finalize = (): Profile =>
    p.splitMode === 'groups' ? { ...p, dayGroups: Object.fromEntries(days.map((wd) => [wd, groupsFor(wd)])) } : p
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
        <Label>Инвентарь</Label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT.map((e) => (
            <Chip key={e.id} active={p.equipment.includes(e.id)} onClick={() => toggleEq(e.id)}>
              {e.label}
            </Chip>
          ))}
        </div>
        {p.equipment.includes('dumbbells') && (
          <div className="mt-4 grid gap-3 rounded-xl bg-white/3 p-3">
            <div className="text-sm text-white/70">Гантели (вес одной гантели)</div>
            <div className="flex items-center justify-between">
              <span className="text-sm">От, кг</span>
              <Stepper value={dumb.min} onChange={(v) => set('dumbbells', { ...dumb, min: v })} step={0.5} min={0.5} max={dumb.max} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">До, кг</span>
              <Stepper value={dumb.max} onChange={(v) => set('dumbbells', { ...dumb, max: v })} step={0.5} min={dumb.min} max={100} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Шаг, кг</span>
              <Stepper value={dumb.step} onChange={(v) => set('dumbbells', { ...dumb, step: v })} step={0.5} min={0.5} max={20} />
            </div>
          </div>
        )}
        {p.equipment.includes('barbell') && (
          <div className="mt-3 grid gap-3 rounded-xl bg-white/3 p-3">
            <div className="text-sm text-white/70">Гриф</div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Вес грифа, кг</span>
              <Stepper value={bar.weight} onChange={(v) => set('bar', { ...bar, weight: v })} step={0.5} min={1} max={25} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Блинов всего, кг</span>
              <Stepper value={bar.maxPlates} onChange={(v) => set('bar', { ...bar, maxPlates: v })} step={2.5} min={0} max={300} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Шаг добавки, кг</span>
              <Stepper value={bar.step} onChange={(v) => set('bar', { ...bar, step: v })} step={0.5} min={0.5} max={10} />
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-white/40">Отжимания и упражнения на весе тела доступны всегда.</p>
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

      <Card>
        <Label>Как делить тренировки</Label>
        <div className="flex gap-2">
          <Chip active={p.splitMode === 'groups'} onClick={() => set('splitMode', 'groups')}>
            По группам мышц
          </Chip>
          <Chip active={p.splitMode !== 'groups'} onClick={() => set('splitMode', 'auto')}>
            Автоматически
          </Chip>
        </div>
        {p.splitMode === 'groups' ? (
          <div className="mt-4 space-y-4">
            {days.map((wd) => (
              <div key={wd}>
                <div className="mb-2 text-sm text-white/70">{WEEKDAYS_FULL[wd]}</div>
                <div className="flex flex-wrap gap-2">
                  {GROUPS.map((g) => (
                    <Chip key={g.id} active={groupsFor(wd).includes(g.id)} onClick={() => toggleGroup(wd, g.id)}>
                      {g.label}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
            {days.length === 0 && <p className="text-xs text-white/40">Сначала выбери дни тренировок.</p>}
          </div>
        ) : (
          <p className="mt-3 text-xs text-white/40">Приложение само подберёт схему под число дней: всё тело, верх/низ или жим/тяга/ноги.</p>
        )}
      </Card>

      <Button className="w-full" disabled={p.weekdays.length === 0} onClick={() => onSave(finalize())}>
        {submitLabel}
      </Button>
    </div>
  )
}
