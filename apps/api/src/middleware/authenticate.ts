import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken, supabase } from '../lib/supabase.js'

export interface AuthUser {
  id: string
  email: string
  role: 'job_seeker' | 'employer' | 'admin'
}

// Extend FastifyRequest to carry the authenticated user
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid Authorization header' })
  }

  const token = authHeader.slice(7)
  const authUser = await verifyToken(token)

  if (!authUser) {
    return reply.status(401).send({ error: 'Invalid or expired token' })
  }

  // Fetch role from our users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  request.user = {
    id: authUser.id,
    email: authUser.email!,
    role: userData?.role ?? 'job_seeker'
  }
}

// Role guard helper
export function requireRole(...roles: AuthUser['role'][]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply)
    if (request.user && !roles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'Insufficient permissions' })
    }
  }
}
