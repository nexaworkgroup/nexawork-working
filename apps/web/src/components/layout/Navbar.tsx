import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Briefcase, MessageSquare, FileText, User, Menu, X, LogOut, Globe } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { clsx } from 'clsx'

export default function Navbar() {
  const { user, profile, signOut, updateLang } = useAuthStore()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path: string) => location.pathname.startsWith(path)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const toggleLang = async () => {
    const next = i18n.language === 'en' ? 'fr' : 'en'
    i18n.changeLanguage(next)
    if (user) await updateLang(next as 'en' | 'fr')
    else localStorage.setItem('nexawork_lang', next)
  }

  const seekerLinks = [
    { to: '/dashboard',    icon: <Briefcase size={16} />, label: t('nav.dashboard') },
    { to: '/jobs',         icon: <Briefcase size={16} />, label: t('nav.jobs') },
    { to: '/applications', icon: <FileText size={16} />,   label: t('nav.applications') },
    { to: '/chat',         icon: <MessageSquare size={16} />, label: t('nav.chat') },
  ]

  const employerLinks = [
    { to: '/employer/dashboard', icon: <Briefcase size={16} />, label: t('nav.dashboard') },
    { to: '/jobs',               icon: <Briefcase size={16} />, label: t('nav.jobs') },
    { to: '/chat',               icon: <MessageSquare size={16} />, label: t('nav.chat') },
  ]

  const links = user?.role === 'employer' ? employerLinks : seekerLinks

  const displayName = user?.role === 'job_seeker'
    ? (profile as any)?.full_name || user.email
    : (profile as any)?.company_name || user?.email

  // Don't show navbar on landing for cleaner look
  if (!user && location.pathname === '/') return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-brand-green">Nexa<span className="text-brand-gold">Work</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={toggleLang} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-green transition-colors px-2 py-1 rounded">
            <Globe size={15} />{i18n.language.toUpperCase()}
          </button>
          <Link to="/login"    className="text-sm text-gray-600 hover:text-brand-green px-3 py-2">{t('nav.login')}</Link>
          <Link to="/register" className="btn-primary text-sm">{t('nav.register')}</Link>
        </div>
      </div>
    </nav>
  )

  if (!user) return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-extrabold text-brand-green">Nexa<span className="text-brand-gold">Work</span></Link>
        <div className="flex items-center gap-3">
          <button onClick={toggleLang} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-green px-2 py-1 rounded transition-colors">
            <Globe size={15} />{i18n.language.toUpperCase()}
          </button>
          <Link to="/login"    className="text-sm text-gray-600 hover:text-brand-green px-3 py-2">{t('nav.login')}</Link>
          <Link to="/register" className="btn-primary text-sm">{t('nav.register')}</Link>
        </div>
      </div>
    </nav>
  )

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={user.role === 'employer' ? '/employer/dashboard' : '/dashboard'}
              className="text-xl font-extrabold text-brand-green shrink-0">
          Nexa<span className="text-brand-gold">Work</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link key={link.to} to={link.to}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(link.to)
                  ? 'bg-brand-green-light text-brand-green'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}>
              {link.icon}{link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={toggleLang}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-green transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100">
            <Globe size={15} />{i18n.language.toUpperCase()}
          </button>
          <Link to="/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-7 h-7 rounded-full bg-brand-green-light text-brand-green flex items-center justify-center text-xs font-bold">
              {displayName?.[0]?.toUpperCase() || <User size={14} />}
            </div>
            <span className="text-sm text-gray-700 max-w-[120px] truncate">{displayName}</span>
          </Link>
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut size={15} />
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {links.map(link => (
            <Link key={link.to} to={link.to}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(link.to)
                  ? 'bg-brand-green-light text-brand-green'
                  : 'text-gray-600 hover:bg-gray-50'
              )}>
              {link.icon}{link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-2 mt-2 flex items-center justify-between">
            <button onClick={toggleLang}
              className="flex items-center gap-1.5 text-sm text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50">
              <Globe size={15} />{i18n.language === 'en' ? 'Français' : 'English'}
            </button>
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-red-500 px-3 py-2 rounded-lg hover:bg-red-50">
              <LogOut size={15} />{t('nav.logout')}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
