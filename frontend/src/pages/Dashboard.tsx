import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

const dashboardStats = [
  { label: 'Workouts', value: '0' },
  { label: 'Exercises', value: '0' },
  { label: 'Total Volume', value: '0 lb' },
]

export function Dashboard() {
  return (
    <section className="PageStack">
      <PageHeader
        title="Dashboard"
        description="Training overview and progress snapshots."
        actions={
          <Link className="Button ButtonPrimary" to="/workouts/new">
            New Workout
          </Link>
        }
      />

      <section className="MetricGrid" aria-label="Training summary">
        {dashboardStats.map((stat) => (
          <article className="MetricCard" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="ContentBand">
        <div className="SectionHeader">
          <h2>Recent Workouts</h2>
          <Link to="/workouts">View History</Link>
        </div>
        <p className="EmptyState">No workouts have been logged yet.</p>
      </section>
    </section>
  )
}
