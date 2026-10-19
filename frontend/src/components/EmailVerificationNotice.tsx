import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function EmailVerificationNotice() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  if (user?.emailVerified !== false || pathname === '/settings') return null

  return (
    <aside className="EmailVerificationNotice" aria-label="Email verification reminder">
      <div>
        <strong>Confirm your recovery email</strong>
        <p>Verify your email in Settings to help protect account recovery. You can correct the address there too.</p>
      </div>
      <Link className="Button ButtonSecondary" to="/settings#recovery-email-heading">Manage Email</Link>
    </aside>
  )
}
