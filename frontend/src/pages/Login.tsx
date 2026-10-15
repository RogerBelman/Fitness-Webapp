import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../hooks/useAuth'

type AuthMode = 'login' | 'register'

export function Login() {
  const { user, login, register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (user) return <Navigate to={destinationFrom(location.state)} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (mode === 'register' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const credentials = { username, password }
      if (mode === 'login') await login(credentials)
      else await register(credentials)
      navigate(destinationFrom(location.state), { replace: true })
    } catch (error) {
      setErrorMessage(readAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setPassword('')
    setConfirmPassword('')
    setErrorMessage(null)
  }

  return (
    <main className="AuthShell">
      <section className="AuthCard" aria-labelledby="auth-title">
        <div className="AuthBrand" aria-hidden="true">WT</div>
        <div className="AuthHeading">
          <p className="AuthEyebrow">Workout Tracker</p>
          <h1 id="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p>
            {mode === 'login'
              ? 'Sign in to continue tracking your training.'
              : 'Create an account to start building your workout history.'}
          </p>
        </div>

        <div className="AuthModeToggle" role="tablist" aria-label="Account action">
          <button
            aria-selected={mode === 'login'}
            role="tab"
            type="button"
            onClick={() => changeMode('login')}
          >
            Sign In
          </button>
          <button
            aria-selected={mode === 'register'}
            role="tab"
            type="button"
            onClick={() => changeMode('register')}
          >
            Create Account
          </button>
        </div>

        <form className="AuthForm" onSubmit={(event) => void submit(event)}>
          <div className="AuthField">
            <label htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              autoComplete="username"
              aria-describedby={mode === 'register' ? 'username-hint' : undefined}
              maxLength={50}
              minLength={3}
              pattern="[A-Za-z0-9_]+"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            {mode === 'register' ? (
              <span className="FieldHint" id="username-hint">Letters, numbers, and underscores only.</span>
            ) : null}
          </div>

          <div className="AuthField">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-describedby={mode === 'register' ? 'password-hint' : undefined}
              maxLength={72}
              minLength={mode === 'register' ? 8 : undefined}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {mode === 'register' ? (
              <span className="FieldHint" id="password-hint">Use at least 8 characters.</span>
            ) : null}
          </div>

          {mode === 'register' ? (
            <div className="AuthField">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <input
                id="auth-confirm-password"
                autoComplete="new-password"
                maxLength={72}
                minLength={8}
                required
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          ) : null}

          {errorMessage ? <p className="Alert AlertError" role="alert">{errorMessage}</p> : null}

          <button className="Button ButtonPrimary AuthSubmit" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>
      </section>
    </main>
  )
}

function destinationFrom(state: unknown) {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'object' &&
    state.from !== null &&
    'pathname' in state.from &&
    typeof state.from.pathname === 'string'
  ) {
    const search = 'search' in state.from && typeof state.from.search === 'string'
      ? state.from.search
      : ''
    return `${state.from.pathname}${search}`
  }
  return '/'
}

function readAuthError(error: unknown) {
  if (
    error instanceof ApiError &&
    typeof error.details === 'object' &&
    error.details !== null &&
    'message' in error.details &&
    typeof error.details.message === 'string'
  ) {
    return error.details.message
  }
  return 'Could not reach the server. Please try again.'
}
