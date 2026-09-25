import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { WorkoutDetails } from '../components/workouts/WorkoutDetails'
import { useWorkout } from '../hooks/useWorkout'

export function WorkoutDetail() {
  const { workoutId } = useParams()
  const { workout, isLoading, errorMessage } = useWorkout(workoutId)

  return (
    <section className="PageStack">
      <PageHeader
        title={workout?.title || 'Workout Details'}
        description={
          workout ? formatWorkoutDate(workout.workoutDate) : 'Workout exercises, sets, and volume.'
        }
        actions={
          <Link className="Button ButtonSecondary" to="/workouts">
            Back to History
          </Link>
        }
      />

      {errorMessage ? <p className="Alert AlertError">{errorMessage}</p> : null}

      {isLoading ? (
        <section className="ContentBand">
          <p className="EmptyState">Loading workout...</p>
        </section>
      ) : null}

      {!isLoading && workout ? <WorkoutDetails workout={workout} /> : null}
    </section>
  )
}

function formatWorkoutDate(workoutDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${workoutDate}T00:00:00Z`))
}
