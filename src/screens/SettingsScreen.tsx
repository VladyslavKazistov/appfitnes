import { useRef, useState } from 'react'
import { generatePlan } from '../lib/generator'
import { exportJson, parseImport } from '../lib/storage'
import { todayISO } from '../lib/stats'
import { useStore } from '../store'
import { EMPTY } from '../lib/storage'
import { Button, Card, Label, Sheet } from '../components/ui'
import { ProfileForm } from './ProfileForm'

export function SettingsScreen() {
  const { state, update } = useStore()
  const [edit, setEdit] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [reset, setReset] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  const doExport = async () => {
    const text = exportJson(state)
    const name = `fitplan-${todayISO()}.json`
    const blob = new Blob([text], { type: 'application/json' })
    const f = new File([blob], name, { type: 'application/json' })
    // На iPhone удобнее «Поделиться» → «Сохранить в Файлы».
    if (navigator.canShare?.({ files: [f] })) {
      try {
        await navigator.share({ files: [f], title: 'FitPlan backup' })
        return
      } catch {
        /* пользователь отменил — пробуем скачать */
      }
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const doImport = async (f: File) => {
    try {
      const st = parseImport(await f.text())
      update(() => st)
      setMsg(`Загружено: ${st.sessions.length} тренировок, ${st.bodyWeight.length} взвешиваний.`)
    } catch (e) {
      setMsg(`Не получилось: ${(e as Error).message}`)
    }
  }

  if (edit)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Мои параметры</h1>
          <Button variant="ghost" onClick={() => setEdit(false)}>
            Отмена
          </Button>
        </div>
        <ProfileForm
          initial={state.profile}
          submitLabel="Сохранить и пересобрать план"
          onSave={(p) => {
            update((st) => {
              const date = todayISO()
              const bodyWeight = st.profile?.weightKg !== p.weightKg ? [...st.bodyWeight.filter((e) => e.date !== date), { date, kg: p.weightKg }] : st.bodyWeight
              return { ...st, profile: p, plan: generatePlan(p), bodyWeight }
            })
            setEdit(false)
          }}
        />
      </div>
    )

  const p = state.profile!
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Профиль</h1>
      <Card>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-white/50">Рост</div>
            <div className="font-semibold">{p.heightCm} см</div>
          </div>
          <div>
            <div className="text-xs text-white/50">Вес</div>
            <div className="font-semibold">{p.weightKg} кг</div>
          </div>
          <div>
            <div className="text-xs text-white/50">Возраст</div>
            <div className="font-semibold">{p.age}</div>
          </div>
        </div>
        <Button variant="soft" className="mt-4 w-full" onClick={() => setEdit(true)}>
          Изменить параметры, инвентарь, дни
        </Button>
      </Card>

      <Card>
        <Label>Резервная копия</Label>
        <p className="mb-3 text-xs text-white/45">Все данные хранятся только на этом телефоне. Время от времени сохраняй копию в «Файлы» или iCloud.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" onClick={doExport}>
            Экспорт
          </Button>
          <Button variant="soft" onClick={() => file.current?.click()}>
            Импорт
          </Button>
        </div>
        <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        {msg && <div className="mt-3 text-xs text-white/60">{msg}</div>}
      </Card>

      <Card>
        <Label>О приложении</Label>
        <p className="text-xs leading-relaxed text-white/45">
          План строится алгоритмом под цель «масса + форма»: базовые упражнения на 6–10 повторов, вспомогательные на 8–15, двойная прогрессия нагрузки. Это не медицинская рекомендация: при боли или травмах проконсультируйся с врачом.
        </p>
      </Card>

      <Button variant="danger" className="w-full" onClick={() => setReset(true)}>
        Стереть все данные
      </Button>
      <Sheet open={reset} onClose={() => setReset(false)} title="Стереть всё?">
        <p className="mb-4 text-sm text-white/60">Профиль, план, история и вес удалятся с телефона. Это нельзя отменить, если нет резервной копии.</p>
        <Button variant="danger" className="w-full" onClick={() => update(() => EMPTY)}>
          Да, стереть
        </Button>
      </Sheet>
    </div>
  )
}
