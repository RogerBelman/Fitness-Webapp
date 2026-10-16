import { ApiError, apiRequest, resetCsrfToken } from './client'
import type {
  AuthUser,
  ChangePasswordInput,
  Credentials,
  DeleteAccountInput,
} from '../types/auth'

export function registerAccount(credentials: Credentials) {
  return apiRequest<AuthUser>('/api/auth/register', {
    method: 'POST',
    body: credentials,
  })
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
