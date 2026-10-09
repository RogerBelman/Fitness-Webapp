import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DeleteButton } from '../components/DeleteButton'
import { PageHeader } from '../components/PageHeader'
import { AddWorkoutExerciseForm } from '../components/workouts/AddWorkoutExerciseForm'
import { WorkoutDetails } from '../components/workouts/WorkoutDetails'
import { WorkoutForm } from '../components/workouts/WorkoutForm'
import { useExercises } from '../hooks/useExercises'
import { useWorkout } from '../hooks/useWorkout'

export function WorkoutDetail() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const {
    workout,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    addExercise,
    addSetEntry,
    saveWorkout,
    removeWorkout,
    saveExercise,
    removeExercise,
    saveSet,
    removeSet,
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
          workout
            ? formatWorkoutDate(workout.workoutDate)
            : 'Workout exercises, sets, and volume.'
        }
        actions={
          <div className="RowActions">
            {workout ? (
              <>
                <button
                  className="Button ButtonSecondary"
                  type="button"
                  disabled={isSaving || isEditing}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Workout
                </button>
                <DeleteButton
                  label="Delete Workout"
                  title="Delete this workout?"
                  description="This permanently deletes the workout, all its exercises, and all logged sets. This cannot be undone."
                  disabled={isSaving || isEditing}
                  onDelete={async () => {
                    const deleted = await removeWorkout()
                    if (deleted) navigate('/workouts', { replace: true })
                    return deleted
                  }}
                />
              </>
            ) : null}
            <Link className="Button ButtonSecondary" to="/workouts">
              Back to History
            </Link>
          </div>
        }
      />

      {errorMessage ? (
        <p className="Alert AlertError" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {exerciseLibraryError ? (
        <p className="Alert AlertError">{exerciseLibraryError}</p>
      ) : null}
      {successMessage ? (
        <p className="Alert AlertSuccess" role="status">
          {successMessage}
        </p>
      ) : null}

      {isLoading ? (
        <section className="ContentBand">
          <p className="EmptyState">Loading workout...</p>
        </section>
      ) : null}

      {!isLoading && workout ? (
        <>
          {isEditing ? (
            <WorkoutForm
              key={workout.id}
              initialValues={{
                workoutDate: workout.workoutDate,
                title: workout.title ?? '',
                notes: workout.notes ?? '',
              }}
              isSaving={isSaving}
              onCancel={() => setIsEditing(false)}
              onCreate={async (request) => {
                const saved = await saveWorkout(request)
                if (saved) setIsEditing(false)
                return saved
              }}
            />
          ) : null}
          <AddWorkoutExerciseForm
            exercises={exercises}
            isLoadingExercises={isLoadingExercises}
            isSaving={isSaving}
            onAdd={addExercise}
          />
          <WorkoutDetails
            isSaving={isSaving}
            onAddSet={addSetEntry}
            workout={workout}
            onSaveExercise={saveExercise}
            onRemoveExercise={removeExercise}
            onSaveSet={saveSet}
            onRemoveSet={removeSet}
          />
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
