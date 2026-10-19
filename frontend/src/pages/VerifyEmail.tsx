import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyAccountEmail } from '../api/auth'
import { ApiError } from '../api/client'
import { PageMetadata } from '../components/PageMetadata'
import { useAuth } from '../hooks/useAuth'

export function VerifyEmail() {
  const [params, setParams] = useSearchParams()
  const token = params.get('token') ?? ''
  const { user, refreshUser } = useAuth()
  const [busy, setBusy] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await verifyAccountEmail(token)
      setVerified(true)
      setParams({}, { replace: true })
      if (user) {
        // Verification succeeded even if refreshing an existing session is temporarily unavailable.
        await refreshUser().catch(() => undefined)
      }
    } catch (failure) {
      const details = failure instanceof ApiError ? failure.details : null
      setError(details && typeof details === 'object' && 'message' in details && typeof details.message === 'string'
        ? details.message : 'Could not verify your email. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="AuthShell">
      <PageMetadata title="Verify Email | Workout Tracker" description="Confirm your Workout Tracker email address." />
      <section className="AuthCard" aria-labelledby="verify-email-title">
        <div className="AuthBrand" aria-hidden="true">WT</div>
        <div className="AuthHeading">
          <p className="AuthEyebrow">Workout Tracker</p>
          <h1 id="verify-email-title">{verified ? 'Email verified' : 'Confirm your email'}</h1>
          <p>{verified ? 'Your email address is confirmed for sign-in and account recovery.' : 'Choose Verify Email to confirm this address. Your link is valid for 24 hours.'}</p>
        </div>
        {!verified && token ? (
          <button className="Button ButtonPrimary" disabled={busy} onClick={() => void confirm()} type="button">
            {busy ? 'Verifying...' : 'Verify Email'}
          </button>
        ) : null}
        {!verified && !token ? <p role="alert">This link is missing its token. Request a new verification email from Settings.</p> : null}
        {error ? <p className="Alert AlertError" role="alert">{error}</p> : null}
        <Link className="AuthTextLink" to={user ? '/settings' : '/login'}>
          {user ? 'Go to Settings' : 'Sign In'}
        </Link>
      </section>
    </main>
  )
}
