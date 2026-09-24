import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { WorkoutList } from '../components/workouts/WorkoutList'
import { useWorkouts } from '../hooks/useWorkouts'

export function WorkoutHistory() {
  const { workouts, isLoading, errorMessage } = useWorkouts()

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

      {errorMessage ? <p className="Alert AlertError">{errorMessage}</p> : null}

      <WorkoutList workouts={workouts} isLoading={isLoading} />
    </section>
  )
}
