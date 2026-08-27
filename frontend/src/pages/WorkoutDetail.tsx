import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

export function WorkoutDetail() {
  const { workoutId } = useParams()

  return (
    <section className="PageStack">
      <PageHeader
        title={`Workout ${workoutId ?? ''}`}
        description="Workout exercises, sets, and volume."
        actions={
          <Link className="Button ButtonSecondary" to="/workouts">
            Back to History
          </Link>
        }
      />

      <section className="ContentBand">
        <p className="EmptyState">Workout details are not loaded yet.</p>
      </section>
    </section>
  )
}
