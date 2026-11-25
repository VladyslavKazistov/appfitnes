import { useEffect, useState } from 'react'
import { getExercise } from '../data/exercises'
import { howTo } from '../data/howto'
import { Sheet } from './ui'

/** Картинки (старт → финиш, сменяются сами) и короткая техника упражнения. */
export function HowToSheet({ exerciseId, onClose }: { exerciseId: string | null; onClose: () => void }) {
  const [frame, setFrame] = useState(0)
  const info = exerciseId ? howTo(exerciseId) : null
  const e = exerciseId ? getExercise(exerciseId) : null
  useEffect(() => {
    setFrame(0)
    if (!info?.images.length) return
    const t = setInterval(() => setFrame((f) => (f + 1) % info.images.length), 1200)
    return () => clearInterval(t)
  }, [exerciseId, info?.images.length])
  return (
    <Sheet open={!!exerciseId} onClose={onClose} title={e?.name ?? ''}>
      {info?.images.length ? (
        <div className="relative mb-4 overflow-hidden rounded-2xl bg-white">
          {info.images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={i === 0 ? 'Начальное положение' : 'Конечное положение'}
              className={`w-full transition-opacity duration-300 ${i === 0 ? '' : 'absolute inset-0'} ${frame === i ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white">{frame === 0 ? 'старт' : 'финиш'}</div>
        </div>
      ) : null}
      {info ? (
        <ol className="list-decimal space-y-1.5 pl-5 text-[15px] text-white/85">
          {info.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-white/60">{e?.tip ?? 'Описание пока не добавлено.'}</p>
      )}
      {info && e?.tip && <p className="mt-3 text-xs text-white/45">💡 {e.tip}</p>}
    </Sheet>
  )
}
