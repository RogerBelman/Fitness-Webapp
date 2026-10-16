import { createContext } from 'react'
import type {
  AuthUser,
  AccountPreferencesInput,
  ChangePasswordInput,
  ChangeEmailInput,
  Credentials,
  DeleteAccountInput,
  RegistrationInput,
} from '../types/auth'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (credentials: Credentials) => Promise<void>
  register: (credentials: RegistrationInput) => Promise<void>
  logout: () => Promise<void>
  updatePreferences: (input: AccountPreferencesInput) => Promise<void>
  changeEmail: (input: ChangeEmailInput) => Promise<void>
  changePassword: (input: ChangePasswordInput) => Promise<void>
  deleteAccount: (input: DeleteAccountInput) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
