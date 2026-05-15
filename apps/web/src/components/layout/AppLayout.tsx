import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Briefcase, FileText, Bookmark,
  User, LogOut, Globe, Users, PlusCircle,
  MessageSquare, FilePlus2
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { clsx } from 'clsx'
import { useState } from 'react'

export default function AppLayout() {
  const { user, profile, signOut } = useAuthStore()
  const { t, i18n } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isEmployer = user?.role === 'employer'

  const seekerLinks = [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Home' },
    { to: '/jobs',         icon: Briefcase,       label: 'Jobs' },
    { to: '/applications', icon: FileText,        label: 'Applications' },
    { to: '/saved',        icon: Bookmark,        label: 'Saved Jobs' },
    { to: '/cv-builder',   icon: FilePlus2,       label: 'Build CV' },
    { to: '/chat',         icon: MessageSquare,   label: 'AI Assistant' },
    { to: '/profile',      icon: User,            label: 'Profile' },
  ]

  const employerLinks = [
    { to: '/employer/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/employer/jobs',       icon: Briefcase,       label: 'My Jobs' },
    { to: '/employer/jobs/new',   icon: PlusCircle,      label: 'Post a Job' },
    { to: '/employer/applicants', icon: Users,           label: 'All Applicants' },
    { to: '/chat',                icon: MessageSquare,   label: 'AI Assistant' },
    { to: '/profile',             icon: User,            label: 'Company Profile' },
  ]

  const links = isEmployer ? employerLinks : seekerLinks

  const toggleLang = async () => {
    const next = i18n.language === 'en' ? 'fr' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('nexawork_lang', next)
    try { await api.put('/auth/language', { lang: next }) } catch {}
  }

  const displayName = isEmployer
    ? (profile as any)?.company_name || 'Employer'
    : (profile as any)?.full_name || user?.email?.split('@')[0] || 'User'

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-2xl font-bold">
          <span className="text-brand-green">Nexa</span>
          <span className="text-gray-900">Work</span>
        </span>
        {isEmployer && (
          <span className="ml-2 text-xs bg-brand-gold-light text-brand-gold-dark px-2 py-0.5 rounded-full font-medium">
            Employer
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive
                ? 'bg-brand-green text-white shadow-sm'
                : 'text-gray-600 hover:bg-brand-green-light hover:text-brand-green'
            )}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <button onClick={toggleLang}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
          <Globe size={18} />
          <span>{i18n.language === 'en' ? 'Français' : 'English'}</span>
        </button>

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button onClick={() => signOut()} className="text-gray-400 hover:text-red-500 transition-colors" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-50">
            <div className="space-y-1">
              <span className="block w-5 h-0.5 bg-gray-600" />
              <span className="block w-5 h-0.5 bg-gray-600" />
              <span className="block w-5 h-0.5 bg-gray-600" />
            </div>
          </button>
          <span className="text-lg font-bold">
            <span className="text-brand-green">Nexa</span>
            <span className="text-gray-900">Work</span>
          </span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
