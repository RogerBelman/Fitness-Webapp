import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/workouts', label: 'Workouts' },
  { to: '/progress', label: 'Progress' },
  { to: '/exercises', label: 'Exercises' },
]

export function AppLayout() {
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
    </div>
  )
}
