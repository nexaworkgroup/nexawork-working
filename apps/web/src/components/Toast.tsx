import { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react'
import { CheckCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastCtx {
  success: (msg: string) => void
  error:   (msg: string) => void
  info:    (msg: string) => void
  warning: (msg: string) => void
}

const Ctx = createContext<ToastCtx>({
  success: () => {}, error: () => {}, info: () => {}, warning: () => {}
})

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-[var(--surface)] border-brand-green text-[var(--text-primary)]',
  error:   'bg-[var(--surface)] border-red-400 text-[var(--text-primary)]',
  info:    'bg-[var(--surface)] border-blue-400 text-[var(--text-primary)]',
  warning: 'bg-[var(--surface)] border-amber-400 text-[var(--text-primary)]',
}

const ICON_COLORS: Record<ToastType, string> = {
  success: 'text-brand-green',
  error:   'text-red-500',
  info:    'text-blue-500',
  warning: 'text-amber-500',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = ICONS[toast.type]
  useEffect(() => {
    const id = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(id)
  }, [toast.id, onDismiss])

  return (
    <div className={clsx(
      'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-card max-w-[340px] w-full animate-slide-up',
      STYLES[toast.type]
    )}>
      <Icon size={18} className={clsx('flex-shrink-0 mt-0.5', ICON_COLORS[toast.type])} />
      <p className="text-sm flex-1 leading-snug">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0">
        <X size={15} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t.slice(-4), { id, type, message }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const ctx: ToastCtx = {
    success: msg => add('success', msg),
    error:   msg => add('error', msg),
    info:    msg => add('info', msg),
    warning: msg => add('warning', msg),
  }

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <div className="fixed bottom-20 md:bottom-5 right-4 z-[100] flex flex-col gap-2 items-end">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() { return useContext(Ctx) }
