import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMeasurementPreferences } from '../hooks/useMeasurementPreferences'
import { useAuth } from '../hooks/useAuth'
import { ActionFeedback } from './ActionFeedback'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/progress', label: 'Progress' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/exercises', label: 'Exercises' },
]

export function AppLayout() {
  const { weightUnit, setWeightUnit } = useMeasurementPreferences()
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
          <div className="AccountControl">
            <span title={user?.username}>{user?.username}</span>
            <button type="button" onClick={() => void signOut()}>Sign Out</button>
          </div>
        </div>
      </header>

      <ActionFeedback errorMessage={logoutError} />

      <main className="PageShell">
        <Outlet />
      </main>

      <footer className="AppFooter">
        <div className="AppFooterContent">
          <NavLink className="FooterLink" to="/data">
            Data &amp; Backup
          </NavLink>
          <div className="FooterPreferences">
            <span className="PreferenceLabel">Weight units</span>
            <div className="WeightUnitControl" role="group" aria-label="Weight unit">
              <div className="WeightUnitToggle">
                {(['lb', 'kg'] as const).map((unit) => (
                  <button
                    aria-pressed={weightUnit === unit}
                    className={weightUnit === unit ? 'WeightUnitOption active' : 'WeightUnitOption'}
                    key={unit}
                    onClick={() => setWeightUnit(unit)}
                    type="button"
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
