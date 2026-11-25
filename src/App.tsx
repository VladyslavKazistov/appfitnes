import { useState } from 'react'
import { useStore } from './store'
import { generatePlan } from './lib/generator'
import { todayISO } from './lib/stats'
import { ProfileForm } from './screens/ProfileForm'
import { PlanScreen } from './screens/PlanScreen'
import { WorkoutScreen } from './screens/WorkoutScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { SettingsScreen } from './screens/SettingsScreen'

type Tab = 'plan' | 'workout' | 'progress' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'plan', label: 'План', icon: '📋' },
  { id: 'workout', label: 'Тренировка', icon: '🏋️' },
  { id: 'progress', label: 'Прогресс', icon: '📈' },
  { id: 'settings', label: 'Профиль', icon: '⚙️' },
]

export default function App() {
  const { state, ready, update } = useStore()
  const [tab, setTab] = useState<Tab>(state.active ? 'workout' : 'plan')

  if (!ready) return <div className="grid h-dvh place-items-center text-white/40">Загрузка…</div>

  if (!state.profile || !state.plan) {
    return (
      <main className="mx-auto max-w-lg px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-10">
        <h1 className="text-3xl font-bold">FitPlan</h1>
        <p className="mt-1 mb-5 text-white/60">Расскажи о себе, и я соберу план тренировок на массу под твой инвентарь и расписание.</p>
        <ProfileForm
          submitLabel="Составить план"
          onSave={(p) =>
            update((st) => ({ ...st, profile: p, plan: generatePlan(p), bodyWeight: [...st.bodyWeight, { date: todayISO(), kg: p.weightKg }] }))
          }
        />
      </main>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <main className="px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+96px)]">
        {tab === 'plan' && <PlanScreen onStart={() => setTab('workout')} />}
        {tab === 'workout' && <WorkoutScreen onFinish={setTab} />}
        {tab === 'progress' && <ProgressScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-ink/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${tab === t.id ? 'text-accent' : 'text-white/50'}`}>
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
              {t.id === 'workout' && state.active && <span className="absolute top-2 right-[30%] h-2 w-2 rounded-full bg-accent" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
