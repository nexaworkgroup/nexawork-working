import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

export type UserRole = 'job_seeker' | 'employer' | 'admin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  lang_preference: 'en' | 'fr'
}

export interface SeekerProfile {
  id: string
  full_name: string
  avatar_url?: string
  location?: string
  degree?: string
  field_of_study?: string
  institution?: string
  graduation_year?: number
  bio?: string
  cv_url?: string
  profile_strength: number
  is_open_to_work: boolean
}

export interface EmployerProfile {
  id: string
  company_name: string
  logo_url?: string
  industry?: string
  company_size?: string
  location?: string
  website?: string
  description?: string
  is_verified: boolean
}

interface AuthState {
  user: AuthUser | null
  profile: SeekerProfile | EmployerProfile | null
  loading: boolean
  initialized: boolean
  setUser: (user: AuthUser | null) => void
  setProfile: (profile: SeekerProfile | EmployerProfile | null) => void
  fetchMe: () => Promise<void>
  signOut: () => Promise<void>
  updateLang: (lang: 'en' | 'fr') => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  fetchMe: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        set({ user: null, profile: null, loading: false, initialized: true })
        return
      }
      const { data } = await api.get('/auth/me')
      set({
        user: data.user,
        profile: data.profile,
        loading: false,
        initialized: true
      })
    } catch {
      set({ user: null, profile: null, loading: false, initialized: true })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  updateLang: async (lang) => {
    await api.put('/auth/language', { lang })
    const user = get().user
    if (user) set({ user: { ...user, lang_preference: lang } })
    localStorage.setItem('nexawork_lang', lang)
  }
}))
