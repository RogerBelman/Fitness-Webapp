import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ActionFeedback } from './ActionFeedback'
import { PageMetadata } from './PageMetadata'
import { EmailVerificationNotice } from './EmailVerificationNotice'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/progress', label: 'Progress' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/exercises', label: 'Exercises' },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const accountMenuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!accountMenuOpen) {
      return
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
        accountMenuButtonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountMenuOpen])

  async function signOut() {
    setAccountMenuOpen(false)
    setLogoutError(null)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Could not sign out. Please try again.')
    }
  }

  return (
    <div className="AppShell">
      <PageMetadata
        description="Your private Workout Tracker account."
        title="Workout Tracker"
      />
      <header className="TopBar">
        <NavLink to="/dashboard" className="Brand" aria-label="Workout Tracker dashboard">
          <span className="BrandMark" aria-hidden="true"><img src="/logo.svg" alt="" /></span>
          <span>Workout Tracker</span>
        </NavLink>

        <div className="TopBarControls">
          <nav className="MainNav" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'NavLink NavLinkActive' : 'NavLink'
                }
                end={item.end}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="AccountMenu" ref={accountMenuRef}>
          <button
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
            aria-label={`Open account menu for ${user?.username}`}
            className="AccountMenuButton"
            onClick={() => setAccountMenuOpen((isOpen) => !isOpen)}
            ref={accountMenuButtonRef}
            type="button"
          >
            {user?.username.charAt(0).toUpperCase()}
          </button>

          {accountMenuOpen && (
            <div className="AccountMenuPopover" role="menu">
              <div className="AccountMenuIdentity">
                <span>Signed in as</span>
                <strong>{user?.username}</strong>
              </div>
              <NavLink
                className="AccountMenuLink"
                onClick={() => setAccountMenuOpen(false)}
                role="menuitem"
                to="/settings"
              >
                Settings
              </NavLink>
              <button
                className="AccountMenuSignOut"
                onClick={() => void signOut()}
                role="menuitem"
                type="button"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <ActionFeedback errorMessage={logoutError} />

      <main className="PageShell">
        <EmailVerificationNotice />
        <Outlet />
      </main>
    </div>
  )
}
