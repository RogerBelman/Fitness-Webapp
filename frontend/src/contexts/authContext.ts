import { createContext } from 'react'
import type { AuthUser, Credentials } from '../types/auth'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (credentials: Credentials) => Promise<void>
  register: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
