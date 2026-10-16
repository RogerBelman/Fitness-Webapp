import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  changeAccountPassword,
  currentAccount,
  deleteCurrentAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
} from '../api/auth'
import type {
  AuthUser,
  ChangePasswordInput,
  Credentials,
  DeleteAccountInput,
} from '../types/auth'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
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
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      async login(credentials: Credentials) {
        setUser(await loginAccount(credentials))
      },
      async register(credentials: Credentials) {
        await registerAccount(credentials)
        setUser(await loginAccount(credentials))
      },
      async logout() {
        await logoutAccount()
        setUser(null)
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
