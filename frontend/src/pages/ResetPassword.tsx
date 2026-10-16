import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetAccountPassword } from '../api/auth'
import { ApiError } from '../api/client'
import { PasswordInput } from '../components/PasswordInput'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const token = searchParams.get('token') ?? ''

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    if (!token) {
      setErrorMessage('This password reset link is missing its token.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await resetAccountPassword({ token, newPassword: password })
      navigate('/login', {
        replace: true,
        state: { notice: 'Password reset. Sign in with your new password.' },
      })
    } catch (error) {
      setErrorMessage(readResetError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="AuthShell">
      <section className="AuthCard" aria-labelledby="reset-password-title">
        <div className="AuthBrand" aria-hidden="true">WT</div>
        <div className="AuthHeading">
          <p className="AuthEyebrow">Account Recovery</p>
          <h1 id="reset-password-title">Choose a new password</h1>
          <p>Your reset link can be used once and expires after 30 minutes.</p>
        </div>
        <form className="AuthForm" onSubmit={(event) => void submit(event)}>
          <div className="AuthField">
            <label htmlFor="reset-password">New Password</label>
            <PasswordInput
              id="reset-password"
              autoComplete="new-password"
              maxLength={72}
              minLength={8}
              required
              toggleLabel="new password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <span className="FieldHint">Use at least 8 characters.</span>
          </div>
          <div className="AuthField">
            <label htmlFor="reset-password-confirmation">Confirm New Password</label>
            <PasswordInput
              id="reset-password-confirmation"
              autoComplete="new-password"
              maxLength={72}
              minLength={8}
              required
              toggleLabel="new password confirmation"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          {errorMessage ? <p className="Alert AlertError" role="alert">{errorMessage}</p> : null}
          <button className="Button ButtonPrimary AuthSubmit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
          <Link className="AuthTextLink" to="/login">Return to Sign In</Link>
        </form>
      </section>
    </main>
  )
}

function readResetError(error: unknown) {
  if (
    error instanceof ApiError &&
    typeof error.details === 'object' &&
    error.details !== null &&
    'message' in error.details &&
    typeof error.details.message === 'string'
  ) {
    return error.details.message
  }
  return 'Could not reset your password. Please try again.'
}
