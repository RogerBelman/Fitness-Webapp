import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../src/contexts/AuthProvider'
import { AppLayout } from '../src/components/AppLayout'
import { Login } from '../src/pages/Login'
import { ProtectedRoute } from '../src/routes/ProtectedRoute'
import { AUTH_REQUIRED_EVENT } from '../src/api/client'

const authApi = vi.hoisted(() => ({
  currentAccount: vi.fn(),
  loginAccount: vi.fn(),
  logoutAccount: vi.fn(),
  registerAccount: vi.fn(),
  changeAccountPassword: vi.fn(),
  deleteCurrentAccount: vi.fn(),
  updateAccountPreferences: vi.fn(),
}))

vi.mock('../src/api/auth', () => authApi)

const account = {
  id: 7,
  username: 'learning_user',
  weightUnit: 'lb' as const,
  createdAt: '2026-10-14T00:00:00Z',
}

describe('authentication workflow', () => {
  beforeEach(() => {
    authApi.currentAccount.mockReset().mockResolvedValue(null)
    authApi.loginAccount.mockReset().mockResolvedValue(account)
    authApi.logoutAccount.mockReset().mockResolvedValue(undefined)
    authApi.registerAccount.mockReset().mockResolvedValue(account)
    authApi.updateAccountPreferences.mockReset().mockResolvedValue(account)
  })

  it('returns to the requested protected page after login', async () => {
    const user = userEvent.setup()
    renderAuthRoutes('/workouts')

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Username'), 'Learning_User')
    const password = screen.getByLabelText('Password')
    await user.type(password, 'session-password')
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(await screen.findByText('Protected workouts')).toBeInTheDocument()
    expect(authApi.loginAccount).toHaveBeenCalledWith({
      username: 'Learning_User',
      password: 'session-password',
    })
  })

  it('registers and signs in a new account', async () => {
    const user = userEvent.setup()
    renderAuthRoutes('/login')

    await screen.findByRole('heading', { name: 'Welcome back' })
    await user.click(screen.getByRole('tab', { name: 'Create Account' }))
    await user.type(screen.getByLabelText('Username'), 'new_user')
    await user.type(screen.getByLabelText('Password'), 'new-password')
    await user.type(screen.getByLabelText('Confirm Password'), 'new-password')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(authApi.registerAccount).toHaveBeenCalledWith({
        username: 'new_user',
        password: 'new-password',
      })
      expect(authApi.loginAccount).toHaveBeenCalledWith({
        username: 'new_user',
        password: 'new-password',
      })
    })
  })

  it('shows account controls in the footer and signs out', async () => {
    const user = userEvent.setup()
    authApi.currentAccount.mockResolvedValue(account)

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route path="login" element={<p>Signed out</p>} />
            <Route element={<AppLayout />}>
              <Route index element={<p>Dashboard content</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    const footer = await screen.findByRole('contentinfo')
    expect(within(footer).getByLabelText('Signed in as learning_user')).toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    )

    await user.click(within(footer).getByRole('button', { name: 'Sign Out' }))

    await waitFor(() => expect(authApi.logoutAccount).toHaveBeenCalledOnce())
    expect(await screen.findByText('Signed out')).toBeInTheDocument()
  })

  it('returns to login when the active session expires', async () => {
    authApi.currentAccount.mockResolvedValue(account)
    renderAuthRoutes('/workouts')

    expect(await screen.findByText('Protected workouts')).toBeInTheDocument()
    window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT))

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })
})

function renderAuthRoutes(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="workouts" element={<p>Protected workouts</p>} />
            <Route index element={<p>Protected dashboard</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}
