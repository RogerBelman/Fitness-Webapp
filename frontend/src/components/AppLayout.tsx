import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ActionFeedback } from './ActionFeedback'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/progress', label: 'Progress' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/exercises', label: 'Exercises' },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState<string | null>(null)

  async function signOut() {
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
      <header className="TopBar">
        <NavLink to="/" className="Brand" aria-label="Workout Tracker home">
          <span className="BrandMark">WT</span>
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
      </header>

      <ActionFeedback errorMessage={logoutError} />

      <main className="PageShell">
        <Outlet />
      </main>

      <footer className="AppFooter">
        <div className="AppFooterContent">
          <div className="FooterAccount" aria-label={`Signed in as ${user?.username}`}>
            <span className="FooterAccountIcon" aria-hidden="true">
              {user?.username.charAt(0).toUpperCase()}
            </span>
            <span className="FooterAccountName">{user?.username}</span>
          </div>
          <div className="FooterActions">
            <NavLink className="FooterLink" to="/settings">
              Settings
            </NavLink>
            <button className="FooterSignOut" type="button" onClick={() => void signOut()}>
              Sign Out
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
