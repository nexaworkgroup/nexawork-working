import axios from 'axios'
import { supabase } from './supabase'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://nexawork-api.onrender.com',
  timeout: 30000
})

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch {}
  return config
})

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status
    const msg = err?.response?.data?.error || err.message || 'Network error'

    // Session expired — sign out and redirect to login
    if (status === 401) {
      const currentPath = window.location.pathname
      // Don't redirect if already on auth pages
      if (!['/login', '/register', '/forgot-password', '/reset-password', '/'].includes(currentPath)) {
        await supabase.auth.signOut()
        window.location.href = '/login'
        return Promise.reject(new Error('Session expired. Please sign in again.'))
      }
    }

    // API server down
    if (!err.response) {
      return Promise.reject(new Error('Cannot connect to server. Please check your connection.'))
    }

    return Promise.reject(new Error(msg))
  }
)
