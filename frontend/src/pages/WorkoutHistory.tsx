import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

export function WorkoutHistory() {
  return (
    <section className="PageStack">
      <PageHeader
        title="Workout History"
        description="Review saved workouts, sets, and volume."
        actions={
          <Link className="Button ButtonPrimary" to="/workouts/new">
            New Workout
          </Link>
        }
      />

      <section className="ContentBand">
        <p className="EmptyState">No workout history yet.</p>
      </section>
    </section>
  )
}
