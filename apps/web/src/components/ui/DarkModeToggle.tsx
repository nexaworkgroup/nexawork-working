import { Sun, Moon } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import { clsx } from 'clsx'

export default function DarkModeToggle({ className = '' }: { className?: string }) {
  const { dark, toggle } = useDarkMode()
  return (
    <button onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}
      className={clsx('relative w-11 h-6 rounded-full transition-colors duration-300', dark ? 'bg-brand-green' : 'bg-gray-200', className)}>
      <span className={clsx('absolute top-0.5 w-5 h-5 rounded-full shadow flex items-center justify-center transition-all duration-300',
        dark ? 'translate-x-5 bg-gray-900' : 'translate-x-0.5 bg-white')}>
        {dark ? <Moon size={11} className="text-brand-gold" /> : <Sun size={11} className="text-amber-500" />}
      </span>
    </button>
  )
}
