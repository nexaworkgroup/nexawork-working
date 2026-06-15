import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, FileText,
  Bell, User, Users, PlusCircle
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { clsx } from 'clsx'

const PUBLIC_PATHS = [
  '/', '/login', '/register',
  '/forgot-password', '/reset-password',
  '/pricing', '/terms', '/privacy',
]

export default function MobileNav() {
  const { user } = useAuthStore()
  const { pathname } = useLocation()

  // Unread notification count
  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
    refetchInterval: 30_000,
    enabled: !!user,
  })
  const unreadCount = countData?.count || 0

  // Hide on public/job-detail pages or when not logged in
  const isPublicPage =
    PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/jobs/')
  if (!user || isPublicPage) return null

  const isEmployer = user.role === 'employer'

  const seekerLinks = [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Home' },
    { to: '/jobs',         icon: Briefcase,       label: 'Jobs'  },
    { to: '/applications', icon: FileText,        label: 'Applied' },
    { to: '/notifications',icon: Bell,            label: 'Alerts', badge: unreadCount },
    { to: '/profile',      icon: User,            label: 'Profile' },
  ]

  const employerLinks = [
    { to: '/employer/dashboard',  icon: LayoutDashboard, label: 'Home' },
    { to: '/employer/jobs/new',   icon: PlusCircle,      label: 'Post Job' },
    { to: '/employer/applicants', icon: Users,           label: 'Applicants' },
    { to: '/notifications',       icon: Bell,            label: 'Alerts', badge: unreadCount },
    { to: '/profile',             icon: User,            label: 'Profile' },
  ]

  const links = isEmployer ? employerLinks : seekerLinks

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex h-16">
        {links.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative',
              isActive ? 'text-brand-green' : 'text-gray-400'
            )}
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  'relative p-1.5 rounded-xl transition-all',
                  isActive && 'bg-brand-green-light'
                )}>
                  <Icon size={20} />
                  {/* Notification badge dot */}
                  {badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
