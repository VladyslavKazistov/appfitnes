import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-panel p-4 ring-1 ring-white/5 ${className}`}>{children}</div>
}

type Variant = 'primary' | 'ghost' | 'danger' | 'soft'
export function Button({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const v: Record<Variant, string> = {
    primary: 'bg-accent text-ink font-semibold active:brightness-90',
    soft: 'bg-white/8 text-white active:bg-white/15',
    ghost: 'text-white/70 active:text-white',
    danger: 'bg-red-500/15 text-red-300 active:bg-red-500/25',
  }
  return <button {...p} className={`rounded-xl px-4 py-3 text-[15px] transition disabled:opacity-40 ${v[variant]} ${className}`} />
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-sm transition ring-1 ${active ? 'bg-accent/15 text-accent ring-accent/50' : 'bg-white/5 text-white/70 ring-white/10'}`}
    >
      {children}
    </button>
  )
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 999, suffix }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 10) / 10))
  return (
    <div className="flex items-center gap-2">
      <button type="button" className="h-10 w-10 rounded-xl bg-white/8 text-lg active:bg-white/15" onClick={() => onChange(clamp(value - step))}>
        −
      </button>
      <input
        inputMode="decimal"
        className="h-10 w-20 rounded-xl bg-white/5 text-center text-lg font-semibold outline-none ring-1 ring-white/10 focus:ring-accent/60"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => {
          const v = parseFloat(e.target.value.replace(',', '.'))
          onChange(Number.isFinite(v) ? v : 0)
        }}
        onBlur={() => onChange(clamp(value))}
      />
      <button type="button" className="h-10 w-10 rounded-xl bg-white/8 text-lg active:bg-white/15" onClick={() => onChange(clamp(value + step))}>
        +
      </button>
      {suffix && <span className="text-sm text-white/50">{suffix}</span>}
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-panel p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-sm text-white/60">{children}</div>
}
