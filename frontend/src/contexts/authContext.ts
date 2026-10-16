import { createContext } from 'react'
import type {
  AuthUser,
  ChangePasswordInput,
  Credentials,
  DeleteAccountInput,
} from '../types/auth'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (credentials: Credentials) => Promise<void>
  register: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
  changePassword: (input: ChangePasswordInput) => Promise<void>
  deleteAccount: (input: DeleteAccountInput) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
