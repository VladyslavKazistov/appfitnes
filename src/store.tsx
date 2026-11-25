import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { AppState } from './types'
import { EMPTY, load, requestPersistence, save } from './lib/storage'

interface Store {
  state: AppState
  ready: boolean
  update: (fn: (s: AppState) => AppState) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY)
  const [ready, setReady] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    load().then((s) => {
      setState(s)
      setReady(true)
    })
    requestPersistence()
  }, [])

  useEffect(() => {
    if (!ready) return
    if (first.current) {
      first.current = false
      return
    }
    save(state)
  }, [state, ready])

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), [])

  return <Ctx.Provider value={{ state, ready, update }}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
