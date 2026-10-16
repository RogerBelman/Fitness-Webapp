import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  changeAccountPassword,
  changeAccountEmail,
  currentAccount,
  deleteCurrentAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
  updateAccountPreferences,
} from '../api/auth'
import { AUTH_REQUIRED_EVENT } from '../api/client'
import type {
  AuthUser,
  AccountPreferencesInput,
  ChangePasswordInput,
  ChangeEmailInput,
  Credentials,
  DeleteAccountInput,
  RegistrationInput,
} from '../types/auth'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    const requireAuthentication = () => setUser(null)
    window.addEventListener(AUTH_REQUIRED_EVENT, requireAuthentication)
    currentAccount()
      .then((account) => {
        if (active) setUser(account)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
      window.removeEventListener(AUTH_REQUIRED_EVENT, requireAuthentication)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      async login(credentials: Credentials) {
        setUser(await loginAccount(credentials))
      },
      async register(credentials: RegistrationInput) {
        await registerAccount(credentials)
        setUser(await loginAccount({
          username: credentials.username,
          password: credentials.password,
        }))
      },
      async logout() {
        await logoutAccount()
        setUser(null)
      },
      async updatePreferences(input: AccountPreferencesInput) {
        setUser(await updateAccountPreferences(input))
      },
      async changeEmail(input: ChangeEmailInput) {
        setUser(await changeAccountEmail(input))
      },
      async changePassword(input: ChangePasswordInput) {
        await changeAccountPassword(input)
        setUser(null)
      },
      async deleteAccount(input: DeleteAccountInput) {
        await deleteCurrentAccount(input)
        setUser(null)
      },
    }),
    [isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
