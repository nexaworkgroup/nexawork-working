import { useState, useCallback, createContext, useContext } from 'react'
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

type ToastType = 'success' | 'error' | 'info' | 'warning'
interface Toast { id: string; message: string; type: ToastType }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void; success: (msg: string) => void; error: (msg: string) => void; info: (msg: string) => void }

const ToastContext = createContext<ToastCtx>({
  toast: () => {}, success: () => {}, error: () => {}, info: () => {}
})

export function useToast() { return useContext(ToastContext) }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev.slice(-3), { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const success = useCallback((m: string) => toast(m, 'success'), [toast])
  const error   = useCallback((m: string) => toast(m, 'error'),   [toast])
  const info    = useCallback((m: string) => toast(m, 'info'),    [toast])

  const ICONS = { success: CheckCircle, error: AlertCircle, info: Info, warning: AlertTriangle }
  const COLOURS = {
    success: 'bg-brand-green text-white',
    error:   'bg-red-500 text-white',
    info:    'bg-blue-500 text-white',
    warning: 'bg-brand-gold text-white'
  }

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <div key={t.id}
              className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium pointer-events-auto animate-in slide-in-from-right-4', COLOURS[t.type])}>
              <Icon size={17} className="flex-shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="opacity-70 hover:opacity-100 ml-1">
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
