import { useEffect, useState } from 'react'
import { lastDays, parsePayload, upsert } from '../lib/activity'
import { formatDate, todayISO, WEEKDAYS } from '../lib/stats'
import { useStore } from '../store'
import { Button, Card, Label, Sheet, Stepper } from '../components/ui'

const fmt = (n: number) => n.toLocaleString('ru-RU')

export function ActivityScreen() {
  const { state, update } = useStore()
  const goal = state.profile?.stepGoal ?? 8000
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [paste, setPaste] = useState(false)
  const [pasted, setPasted] = useState('')
  const [help, setHelp] = useState(state.activity.length === 0)
  const [goalEdit, setGoalEdit] = useState(false)

  const today = todayISO()
  const todayEntry = state.activity.find((a) => a.date === today)
  const latest = state.activity.at(-1)
  const shown = todayEntry ?? latest
  const days = lastDays(state.activity, 14)
  const week = lastDays(state.activity, 7).filter((d) => d.entry)
  const avg = week.length ? Math.round(week.reduce((a, d) => a + d.entry!.steps, 0) / week.length) : null
  const weekKm = week.reduce((a, d) => a + (d.entry!.km ?? 0), 0)
  const max = Math.max(goal, ...days.map((d) => d.entry?.steps ?? 0))

  const accept = (text: string) => {
    const e = parsePayload(text)
    if (!e) {
      setMsg({ ok: false, text: 'В буфере нет данных FitPlan. Запусти команду «FitPlan шаги» и нажми ещё раз.' })
      return false
    }
    update((st) => ({ ...st, activity: upsert(st.activity, e) }))
    setMsg({ ok: true, text: `Записано: ${formatDate(e.date)} — ${fmt(e.steps)} шагов${e.km != null ? `, ${e.km.toLocaleString('ru-RU')} км` : ''}.` })
    return true
  }

  const sync = async () => {
    try {
      const text = await navigator.clipboard.readText()
      accept(text)
    } catch {
      // Буфер недоступен (запрет или старый iOS) — даём вставить вручную долгим нажатием.
      setPaste(true)
    }
  }

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 6000)
    return () => clearTimeout(t)
  }, [msg])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Активность</h1>

      <Card>
        <div className="flex items-baseline justify-between">
          <Label>{shown && shown.date !== today ? `Последние данные: ${formatDate(shown.date)}` : 'Сегодня'}</Label>
          <button className="text-xs text-white/50" onClick={() => setGoalEdit(true)}>
            цель {fmt(goal)}
          </button>
        </div>
        <div className="flex items-end gap-3">
          <div className="text-5xl font-bold tabular-nums">{shown ? fmt(shown.steps) : '—'}</div>
          <div className="pb-1.5 text-white/50">шагов</div>
        </div>
        <div className="mt-1 text-white/60">{shown?.km != null ? `${shown.km.toLocaleString('ru-RU')} км` : 'дистанция появится после синхронизации'}</div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, ((shown?.steps ?? 0) / goal) * 100)}%` }} />
        </div>
        <Button className="mt-4 w-full" onClick={sync}>
          Обновить из «Здоровья»
        </Button>
        {msg && <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${msg.ok ? 'bg-accent/10 text-accent' : 'bg-amber-400/10 text-amber-300'}`}>{msg.text}</div>}
      </Card>

      <Card>
        <Label>Последние 14 дней</Label>
        <div className="flex h-36 items-end gap-1">
          {days.map((d) => {
            const steps = d.entry?.steps ?? 0
            const wd = (new Date(d.date + 'T12:00:00').getDay() + 6) % 7
            return (
              <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div
                  className={`w-full rounded-t-md ${steps >= goal ? 'bg-accent' : steps ? 'bg-accent/45' : 'bg-white/5'}`}
                  style={{ height: `${steps ? Math.max(4, (steps / max) * 100) : 3}%` }}
                  title={`${d.date}: ${steps}`}
                />
                <div className={`text-[9px] ${d.date === today ? 'text-accent' : 'text-white/35'}`}>{WEEKDAYS[wd].slice(0, 2)}</div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-white/5 py-2">
            <div className="text-xs text-white/50">В среднем за 7 дней</div>
            <div className="font-semibold">{avg != null ? fmt(avg) : '—'}</div>
          </div>
          <div className="rounded-xl bg-white/5 py-2">
            <div className="text-xs text-white/50">Км за 7 дней</div>
            <div className="font-semibold">{week.length ? weekKm.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) : '—'}</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/40">На массе много ходьбы — это лишние калории в минус: если вес стоит, а шагов больше 12 000, добавь немного еды.</p>
      </Card>

      <Card className="p-0">
        <button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setHelp(!help)}>
          <span className="font-semibold">Как подключить шаги с iPhone</span>
          <span className="text-white/40">{help ? '−' : '+'}</span>
        </button>
        {help && (
          <div className="space-y-3 border-t border-white/5 px-4 py-4 text-sm leading-relaxed text-white/75">
            <p className="text-xs text-white/50">
              Веб-приложения не имеют доступа к «Здоровью» напрямую, поэтому данные передаёт команда iOS через буфер обмена. Настраивается один раз, минут 5.
            </p>
            <div>
              <div className="font-medium text-white">1. Создай команду</div>
              Приложение «Команды» → «+» → назови «FitPlan шаги». Добавь действия по порядку:
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                <li>«Найти образцы данных Здоровья»: тип <b>Шаги</b>, фильтр «Дата начала — сегодня».</li>
                <li>«Вычислить статистику»: <b>Сумма</b>.</li>
                <li>Ещё раз «Найти образцы данных Здоровья»: тип <b>Расстояние ходьбы и бега</b>, «Дата начала — сегодня».</li>
                <li>Ещё раз «Вычислить статистику»: <b>Сумма</b>.</li>
                <li>«Форматировать дату»: Текущая дата, формат «Особый» → <code className="rounded bg-white/10 px-1">yyyy-MM-dd</code>.</li>
                <li>
                  «Текст»: <code className="rounded bg-white/10 px-1">FITPLAN date=</code>[Форматированная дата] <code className="rounded bg-white/10 px-1">steps=</code>[Статистика] <code className="rounded bg-white/10 px-1">km=</code>[Статистика 2]. Переменные вставляй из подсказок над клавиатурой.
                </li>
                <li>«Скопировать в буфер обмена».</li>
              </ol>
              При первом запуске iPhone спросит доступ к «Здоровью» — разреши.
            </div>
            <div>
              <div className="font-medium text-white">2. Запуск каждый день сам</div>
              «Команды» → «Автоматизация» → «+» → «Время суток» → например 22:00, «Ежедневно», «Запускать немедленно» → действие «Запустить команду» → «FitPlan шаги».
            </div>
            <div>
              <div className="font-medium text-white">3. В FitPlan</div>
              Открой этот экран и нажми «Обновить из „Здоровья“» → «Вставить». Если хочешь свежие цифры днём, запусти команду вручную (можно с виджета) и снова нажми кнопку.
            </div>
          </div>
        )}
      </Card>

      <Sheet open={paste} onClose={() => setPaste(false)} title="Вставь данные из команды">
        <p className="mb-3 text-sm text-white/60">Браузер не дал прочитать буфер сам. Нажми и удерживай поле → «Вставить».</p>
        <textarea
          className="h-24 w-full rounded-xl bg-white/5 p-3 text-base outline-none ring-1 ring-white/10 focus:ring-accent/60"
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="FITPLAN date=… steps=… km=…"
        />
        <Button
          className="mt-3 w-full"
          onClick={() => {
            if (accept(pasted)) {
              setPaste(false)
              setPasted('')
            }
          }}
        >
          Сохранить
        </Button>
      </Sheet>

      <Sheet open={goalEdit} onClose={() => setGoalEdit(false)} title="Цель по шагам">
        <div className="flex justify-center">
          <Stepper
            value={goal}
            step={1000}
            min={1000}
            max={40000}
            onChange={(v) => update((st) => (st.profile ? { ...st, profile: { ...st.profile, stepGoal: v } } : st))}
          />
        </div>
        <Button className="mt-4 w-full" onClick={() => setGoalEdit(false)}>
          Готово
        </Button>
      </Sheet>
    </div>
  )
}
