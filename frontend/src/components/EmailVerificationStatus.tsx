import { useEffect, useState } from 'react'
import { requestEmailVerification } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuth } from '../hooks/useAuth'

export function EmailVerificationStatus() {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sent) return
    const timer = window.setTimeout(() => setSent(false), 120_000)
    return () => window.clearTimeout(timer)
  }, [sent])

  async function resend() {
    setBusy(true)
    setError(null)
    setSent(false)
    try {
      await requestEmailVerification()
      setSent(true)
    } catch (failure) {
      const details = failure instanceof ApiError ? failure.details : null
      setError(details && typeof details === 'object' && 'message' in details && typeof details.message === 'string'
        ? details.message : 'Could not send the verification email. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (user?.emailVerified) return <p className="EmailVerified">Email verified</p>

  return (
    <div className="EmailVerificationStatus">
      <p>Your email has not been verified. Confirm it to make sure password reset links reach you.</p>
      {user?.email ? (
        <button className="Button ButtonSecondary" disabled={busy || sent} onClick={() => void resend()} type="button">
          {busy ? 'Sending...' : sent ? 'Verification Email Sent' : 'Resend Verification Email'}
        </button>
      ) : null}
      {sent ? <p role="status">Check {user?.email} for a link valid for 24 hours. Check your spam folder too.</p> : null}
      {error ? <p className="Alert AlertError" role="alert">{error}</p> : null}
    </div>
  )
}
