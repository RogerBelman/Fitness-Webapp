import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { AddWorkoutExerciseForm } from '../components/workouts/AddWorkoutExerciseForm'
import { WorkoutDetails } from '../components/workouts/WorkoutDetails'
import { useExercises } from '../hooks/useExercises'
import { useWorkout } from '../hooks/useWorkout'

export function WorkoutDetail() {
  const { workoutId } = useParams()
  const {
    workout,
    isLoading,
    isAddingExercise,
    errorMessage,
    successMessage,
    addExercise,
  } = useWorkout(workoutId)
  const {
    exercises,
    isLoading: isLoadingExercises,
    errorMessage: exerciseLibraryError,
  } = useExercises('', '')

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
      {exerciseLibraryError ? <p className="Alert AlertError">{exerciseLibraryError}</p> : null}
      {successMessage ? <p className="Alert AlertSuccess">{successMessage}</p> : null}

      {isLoading ? (
        <section className="ContentBand">
          <p className="EmptyState">Loading workout...</p>
        </section>
      ) : null}

      {!isLoading && workout ? (
        <>
          <AddWorkoutExerciseForm
            exercises={exercises}
            isLoadingExercises={isLoadingExercises}
            isSaving={isAddingExercise}
            onAdd={addExercise}
          />
          <WorkoutDetails workout={workout} />
        </>
      ) : null}
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
