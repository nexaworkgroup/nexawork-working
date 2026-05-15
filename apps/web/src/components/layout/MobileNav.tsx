import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, FileText, MessageSquare, User, Users, PlusCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { clsx } from 'clsx'

export default function MobileNav() {
  const { user } = useAuthStore()
  if (!user) return null

  const isEmployer = user.role === 'employer'

  const seekerLinks = [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Home' },
    { to: '/jobs',         icon: Briefcase,       label: 'Jobs' },
    { to: '/applications', icon: FileText,         label: 'Applied' },
    { to: '/chat',         icon: MessageSquare,   label: 'AI' },
    { to: '/profile',      icon: User,            label: 'Profile' },
  ]

  const employerLinks = [
    { to: '/employer/dashboard',  icon: LayoutDashboard, label: 'Home' },
    { to: '/employer/jobs/new',   icon: PlusCircle,      label: 'Post Job' },
    { to: '/employer/applicants', icon: Users,            label: 'Applicants' },
    { to: '/chat',                icon: MessageSquare,   label: 'AI' },
    { to: '/profile',             icon: User,            label: 'Profile' },
  ]

  const links = isEmployer ? employerLinks : seekerLinks

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-bottom">
      <div className="flex">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => clsx(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors',
              isActive ? 'text-brand-green' : 'text-gray-400'
            )}>
            {({ isActive }) => (
              <>
                <div className={clsx('p-1.5 rounded-xl transition-all', isActive && 'bg-brand-green-light')}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
