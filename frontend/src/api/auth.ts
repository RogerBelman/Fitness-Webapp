import { ApiError, apiRequest, resetCsrfToken } from './client'
import type {
  AuthUser,
  AccountPreferencesInput,
  ChangePasswordInput,
  ChangeEmailInput,
  Credentials,
  DeleteAccountInput,
  RegistrationInput,
  ResetPasswordInput,
} from '../types/auth'

export function registerAccount(credentials: RegistrationInput) {
  return apiRequest<AuthUser>('/api/auth/register', {
    method: 'POST',
    body: credentials,
  })
}

export async function requestPasswordReset(email: string) {
  await apiRequest<void>('/api/auth/password/forgot', {
    method: 'POST',
    body: { email },
  })
}

export async function resetAccountPassword(input: ResetPasswordInput) {
  await apiRequest<void>('/api/auth/password/reset', {
    method: 'POST',
    body: input,
  })
  resetCsrfToken()
}

export async function requestEmailVerification() {
  await apiRequest<void>('/api/auth/email/verification', { method: 'POST' })
}

export async function verifyAccountEmail(token: string) {
  await apiRequest<void>('/api/auth/email/verify', { method: 'POST', body: { token } })
}

export function loginAccount(credentials: Credentials) {
  return apiRequest<AuthUser>('/api/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export async function currentAccount() {
  try {
    return await apiRequest<AuthUser>('/api/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export async function logoutAccount() {
  await apiRequest<void>('/api/auth/logout', { method: 'POST' })
  resetCsrfToken()
}

export function updateAccountPreferences(input: AccountPreferencesInput) {
  return apiRequest<AuthUser>('/api/auth/preferences', {
    method: 'PUT',
    body: input,
  })
}

export function changeAccountEmail(input: ChangeEmailInput) {
  return apiRequest<AuthUser>('/api/auth/email', {
    method: 'PUT',
    body: input,
  })
}

export async function changeAccountPassword(input: ChangePasswordInput) {
  await apiRequest<void>('/api/auth/password', {
    method: 'PUT',
    body: input,
  })
  resetCsrfToken()
}

export async function deleteCurrentAccount(input: DeleteAccountInput) {
  await apiRequest<void>('/api/auth/account', {
    method: 'DELETE',
    body: input,
  })
  resetCsrfToken()
}
