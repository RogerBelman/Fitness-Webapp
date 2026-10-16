import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/auth'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await requestPasswordReset(email)
      setIsComplete(true)
    } catch {
      setErrorMessage('Could not request a reset link. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="AuthShell">
      <section className="AuthCard" aria-labelledby="forgot-password-title">
        <div className="AuthBrand" aria-hidden="true">WT</div>
        <div className="AuthHeading">
          <p className="AuthEyebrow">Account Recovery</p>
          <h1 id="forgot-password-title">Reset your password</h1>
          <p>Enter the recovery email connected to your account.</p>
        </div>

        {isComplete ? (
          <div className="AuthForm">
            <p className="Alert AlertSuccess" role="status">
              If that email belongs to an account, a reset link is on its way.
            </p>
            <Link className="Button ButtonPrimary AuthSubmit" to="/login">
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form className="AuthForm" onSubmit={(event) => void submit(event)}>
            <div className="AuthField">
              <label htmlFor="recovery-email">Recovery Email</label>
              <input
                id="recovery-email"
                autoComplete="email"
                maxLength={254}
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {errorMessage ? <p className="Alert AlertError" role="alert">{errorMessage}</p> : null}
            <button className="Button ButtonPrimary AuthSubmit" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
            <Link className="AuthTextLink" to="/login">Return to Sign In</Link>
          </form>
        )}
      </section>
    </main>
  )
}
