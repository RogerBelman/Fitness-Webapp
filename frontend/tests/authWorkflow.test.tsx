import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../src/contexts/AuthProvider'
import { AppLayout } from '../src/components/AppLayout'
import { Login } from '../src/pages/Login'
import { ForgotPassword } from '../src/pages/ForgotPassword'
import { ResetPassword } from '../src/pages/ResetPassword'
import { Landing } from '../src/pages/Landing'
import { VerifyEmail } from '../src/pages/VerifyEmail'
import { EmailVerificationStatus } from '../src/components/EmailVerificationStatus'
import { ProtectedRoute } from '../src/routes/ProtectedRoute'
import { AUTH_REQUIRED_EVENT } from '../src/api/client'

const authApi = vi.hoisted(() => ({
  currentAccount: vi.fn(),
  loginAccount: vi.fn(),
  logoutAccount: vi.fn(),
  registerAccount: vi.fn(),
  changeAccountPassword: vi.fn(),
  changeAccountEmail: vi.fn(),
  deleteCurrentAccount: vi.fn(),
  updateAccountPreferences: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetAccountPassword: vi.fn(),
  requestEmailVerification: vi.fn(),
  verifyAccountEmail: vi.fn(),
}))

vi.mock('../src/api/auth', () => authApi)

const account = {
  id: 7,
  username: 'learning_user',
  email: 'learning@example.com',
  emailVerified: true,
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
    authApi.changeAccountEmail.mockReset().mockResolvedValue(account)
    authApi.requestPasswordReset.mockReset().mockResolvedValue(undefined)
    authApi.resetAccountPassword.mockReset().mockResolvedValue(undefined)
    authApi.requestEmailVerification.mockReset().mockResolvedValue(undefined)
    authApi.verifyAccountEmail.mockReset().mockResolvedValue(undefined)
  })

  it('opens registration from the public landing page', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route index element={<Landing />} />
            <Route path="login" element={<Login />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', {
      name: 'Keep your workouts and progress in one place.',
    })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Create an Account' }))

    expect(await screen.findByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('returns to the requested protected page after login', async () => {
    const user = userEvent.setup()
    renderAuthRoutes('/workouts')

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Username or email'), 'Learning_User')
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

  it('accepts an email in the sign-in field without the registration username pattern', async () => {
    const user = userEvent.setup()
    renderAuthRoutes('/login')
    const input = await screen.findByLabelText('Username or email')
    expect(input).not.toHaveAttribute('pattern')
    await user.type(input, 'learning@example.com')
    await user.type(screen.getByLabelText('Password'), 'session-password')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(await screen.findByText('Protected dashboard')).toBeInTheDocument()
    expect(authApi.loginAccount).toHaveBeenCalledWith({ username: 'learning@example.com', password: 'session-password' })
  })

  it('verifies a link only after explicit confirmation', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/verify-email?token=test-verification-token']}>
        <AuthProvider><VerifyEmail /></AuthProvider>
      </MemoryRouter>,
    )
    expect(authApi.verifyAccountEmail).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Verify Email' }))
    expect(await screen.findByRole('heading', { name: 'Email verified' })).toBeInTheDocument()
    expect(authApi.verifyAccountEmail).toHaveBeenCalledWith('test-verification-token')
  })

  it('shows resend feedback next to the recovery-email controls', async () => {
    const user = userEvent.setup()
    authApi.currentAccount.mockResolvedValue({ ...account, emailVerified: false })
    render(
      <MemoryRouter><AuthProvider><EmailVerificationStatus /></AuthProvider></MemoryRouter>,
    )
    await screen.findByText(/Your email has not been verified/)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Resend Verification Email' })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Resend Verification Email' }))
    expect(authApi.requestEmailVerification).toHaveBeenCalledOnce()
    expect(await screen.findByRole('status')).toHaveTextContent('Check learning@example.com')
  })

  it('registers and signs in a new account', async () => {
    const user = userEvent.setup()
    renderAuthRoutes('/login')

    await screen.findByRole('heading', { name: 'Welcome back' })
    await user.click(screen.getByRole('tab', { name: 'Create Account' }))
    await user.type(screen.getByLabelText('Username'), 'new_user')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'new-password')
    await user.type(screen.getByLabelText('Confirm Password'), 'new-password')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(authApi.registerAccount).toHaveBeenCalledWith({
        username: 'new_user',
        email: 'new@example.com',
        password: 'new-password',
      })
      expect(authApi.loginAccount).toHaveBeenCalledWith({
        username: 'new_user',
        password: 'new-password',
      })
    })
  })

  it('opens the account menu and signs out', async () => {
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

    const accountButton = await screen.findByRole('button', {
      name: 'Open account menu for learning_user',
    })
    await user.click(accountButton)

    const accountMenu = screen.getByRole('menu')
    expect(within(accountMenu).getByText('learning_user')).toBeInTheDocument()
    expect(within(accountMenu).getByRole('menuitem', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    )

    await user.click(within(accountMenu).getByRole('menuitem', { name: 'Sign Out' }))

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

  it('requests recovery without revealing whether the email exists', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Recovery Email'), 'person@example.com')
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }))

    await waitFor(() => expect(authApi.requestPasswordReset).toHaveBeenCalledWith('person@example.com'))
    expect(screen.getByText(/If that email belongs to an account/)).toBeInTheDocument()
  })

  it('submits a one-time token with the new password', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/reset-password?token=one-time-token']}>
        <Routes>
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="login" element={<p>Login destination</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('New Password'), 'updated-password')
    await user.type(screen.getByLabelText('Confirm New Password'), 'updated-password')
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))

    await waitFor(() => expect(authApi.resetAccountPassword).toHaveBeenCalledWith({
      token: 'one-time-token',
      newPassword: 'updated-password',
    }))
    expect(await screen.findByText('Login destination')).toBeInTheDocument()
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
            <Route path="dashboard" element={<p>Protected dashboard</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}
