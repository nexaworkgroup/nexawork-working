import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useDarkMode } from '../../hooks/useDarkMode'
import DarkModeToggle from '../ui/DarkModeToggle'
import {
  LayoutDashboard, Briefcase, FileText, Bookmark, User, LogOut,
  Globe, Users, PlusCircle, MessageSquare, FilePlus2, Target,
  Bell, Calendar, DollarSign, BarChart2, Shield, ChevronLeft, Menu
} from 'lucide-react'
import { api } from '../../lib/api'
import { clsx } from 'clsx'

export default function AppLayout() {
  const { t, i18n } = useTranslation()
  const { user, profile, clearUser } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { dark } = useDarkMode()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  useEffect(() => {
    if (!user) return
    const fetch = () => api.get('/notifications/unread-count').then(r => setUnread(r.data.count || 0)).catch(() => {})
    fetch()
    const id = setInterval(fetch, 30_000)
    return () => clearInterval(id)
  }, [user])

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'fr' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('nexawork_lang', next)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) api.put('/auth/language', { lang: next }).catch(() => {})
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    clearUser()
    navigate('/login')
  }

  const isSeeker = user?.role === 'job_seeker'
  const p = profile as any
  const displayName = p?.full_name || p?.company_name || user?.email?.split('@')[0] || ''

  const seekerNav = [
    { to: '/dashboard',       icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/jobs',            icon: Briefcase,       label: t('nav.jobs') },
    { to: '/applications',    icon: FileText,        label: t('nav.applications') },
    { to: '/saved',           icon: Bookmark,        label: t('nav.saved') },
    { to: '/cv-builder',      icon: FilePlus2,       label: 'CV Builder' },
    { to: '/skill-gap',       icon: Target,          label: t('nav.skill_gap') },
    { to: '/job-alerts',      icon: Bell,            label: t('nav.job_alerts') },
    { to: '/remote-ready',    icon: Shield,          label: 'Remote Ready' },
    { to: '/interviews',      icon: Calendar,        label: t('nav.interviews') },
    { to: '/profile',         icon: User,            label: t('nav.profile') },
  ]

  const employerNav = [
    { to: '/employer/dashboard',    icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/employer/jobs',         icon: Briefcase,       label: t('nav.my_jobs') },
    { to: '/employer/jobs/new',     icon: PlusCircle,      label: t('nav.post_job') },
    { to: '/employer/applicants',   icon: Users,           label: t('nav.applicants') },
    { to: '/employer/interviews',   icon: Calendar,        label: t('nav.interviews') },
    { to: '/employer/analytics',    icon: BarChart2,       label: t('nav.analytics') },
    { to: '/employer/verification', icon: Shield,          label: t('nav.verification') },
    { to: '/profile',               icon: User,            label: t('nav.profile') },
  ]

  const navItems = isSeeker ? seekerNav : employerNav
  const bottomNavItems = navItems.slice(0, 5)

  const NavContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--border)] flex-shrink-0">
        <Link to={isSeeker ? '/dashboard' : '/employer/dashboard'}
          className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 bg-brand-green rounded-xl flex items-center justify-center flex-shrink-0 shadow-green">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          {(!collapsed || mobile) && (
            <span className="font-bold text-[15px] truncate">
              <span className="text-brand-green">Nexa</span>
              <span className="text-[var(--text-primary)]">Work</span>
            </span>
          )}
        </Link>
        {!mobile && (
          <button onClick={() => setCollapsed(c => !c)}
            className="p-1 rounded-lg hover:bg-[var(--border-soft)] text-[var(--text-muted)] transition-colors hidden md:flex flex-shrink-0">
            <ChevronLeft size={15} className={clsx('transition-transform duration-300', collapsed && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === (isSeeker ? '/dashboard' : '/employer/dashboard')
            ? location.pathname === to
            : location.pathname.startsWith(to)
          return (
            <Link key={to} to={to}
              className={clsx(
                'flex items-center gap-3 py-2.5 rounded-xl transition-all duration-150 group relative',
                collapsed && !mobile ? 'px-2 justify-center' : 'px-3',
                active
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--border-soft)] hover:text-[var(--text-primary)]'
              )}>
              <Icon size={17} className="flex-shrink-0" />
              {(!collapsed || mobile) && (
                <span className="text-sm font-medium truncate flex-1">{label}</span>
              )}
              {to === '/job-alerts' && unread > 0 && (!collapsed || mobile) && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
              {collapsed && !mobile && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg
                                opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg
                                transition-opacity duration-150">
                  {label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[var(--border)] p-2.5 space-y-1.5 flex-shrink-0">
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-[var(--border-soft)]">
            <div className="w-7 h-7 rounded-full bg-brand-green flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{displayName}</p>
              <p className="text-[10px] text-[var(--text-muted)] capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}

        <div className={clsx('flex items-center gap-2 px-1', collapsed && !mobile ? 'flex-col' : '')}>
          <DarkModeToggle />
          {(!collapsed || mobile) && (
            <button onClick={toggleLang}
              className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-brand-green transition-colors px-2 py-1 rounded-lg hover:bg-[var(--border-soft)]">
              <Globe size={13} />{i18n.language === 'en' ? 'FR' : 'EN'}
            </button>
          )}
          <button onClick={handleSignOut}
            className={clsx('flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20',
              collapsed && !mobile ? 'justify-center w-full' : 'ml-auto')}>
            <LogOut size={14} />
            {(!collapsed || mobile) && <span>Out</span>}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Desktop sidebar */}
      <aside className={clsx(
        'hidden md:flex flex-col border-r border-[var(--border)] transition-[width] duration-300 flex-shrink-0 bg-[var(--surface)]',
        collapsed ? 'w-[58px]' : 'w-[216px]'
      )}>
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-[var(--surface)] border-r border-[var(--border)] z-50 flex flex-col shadow-modal animate-slide-down">
            <NavContent mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
          <button onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl hover:bg-[var(--border-soft)] text-[var(--text-secondary)] transition-colors">
            <Menu size={20} />
          </button>
          <Link to={isSeeker ? '/dashboard' : '/employer/dashboard'} className="font-bold text-base flex-1">
            <span className="text-brand-green">Nexa</span><span className="text-[var(--text-primary)]">Work</span>
          </Link>
          <DarkModeToggle />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-stretch border-t border-[var(--border)] bg-[var(--surface)] flex-shrink-0"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {bottomNavItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || (to !== '/dashboard' && to !== '/employer/dashboard' && location.pathname.startsWith(to))
            return (
              <Link key={to} to={to}
                className={clsx('flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors min-w-0',
                  active ? 'text-brand-green' : 'text-[var(--text-muted)]')}>
                <div className="relative">
                  <Icon size={21} />
                  {to === '/job-alerts' && unread > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                      {unread > 9 ? '!' : unread}
                    </span>
                  )}
                </div>
                <span className={clsx('text-[10px] font-medium leading-none truncate max-w-[48px] text-center',
                  active && 'text-brand-green')}>
                  {label.split(' ')[0]}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
