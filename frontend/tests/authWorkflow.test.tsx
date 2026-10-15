import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../src/contexts/AuthProvider'
import { Login } from '../src/pages/Login'
import { ProtectedRoute } from '../src/routes/ProtectedRoute'

const authApi = vi.hoisted(() => ({
  currentAccount: vi.fn(),
  loginAccount: vi.fn(),
  logoutAccount: vi.fn(),
  registerAccount: vi.fn(),
}))

vi.mock('../src/api/auth', () => authApi)

const account = {
  id: 7,
  username: 'learning_user',
  createdAt: '2026-10-14T00:00:00Z',
}

describe('authentication workflow', () => {
  beforeEach(() => {
    authApi.currentAccount.mockReset().mockResolvedValue(null)
    authApi.loginAccount.mockReset().mockResolvedValue(account)
    authApi.logoutAccount.mockReset().mockResolvedValue(undefined)
    authApi.registerAccount.mockReset().mockResolvedValue(account)
  })

  it('returns to the requested protected page after login', async () => {
    const user = userEvent.setup()
    renderAuthRoutes('/workouts')

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Username'), 'Learning_User')
    await user.type(screen.getByLabelText('Password'), 'session-password')
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
