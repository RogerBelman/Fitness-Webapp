import { NavLink, Outlet } from 'react-router-dom'
import { useMeasurementPreferences } from '../hooks/useMeasurementPreferences'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/progress', label: 'Progress' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/exercises', label: 'Exercises' },
]

export function AppLayout() {
  const { weightUnit, setWeightUnit } = useMeasurementPreferences()

  return (
    <div className="AppShell">
      <header className="TopBar">
        <NavLink to="/" className="Brand" aria-label="Workout Tracker home">
          <span className="BrandMark">WT</span>
          <span>Workout Tracker</span>
        </NavLink>

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
      </header>

      <main className="PageShell">
        <Outlet />
      </main>

      <footer className="AppFooter">
        <div className="AppFooterContent">
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
      </footer>
    </div>
  )
}
