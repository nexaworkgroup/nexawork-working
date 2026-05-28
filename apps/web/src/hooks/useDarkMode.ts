import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem('nw_theme')
      if (stored) return stored === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch { return false }
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('nw_theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('nw_theme', 'light')
    }
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}
