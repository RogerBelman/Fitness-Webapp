import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DeleteButton } from '../components/DeleteButton'
import { ActionFeedback } from '../components/ActionFeedback'
import { PageHeader } from '../components/PageHeader'
import { ExerciseForm } from '../components/exercises/ExerciseForm'
import { AddWorkoutExerciseForm } from '../components/workouts/AddWorkoutExerciseForm'
import { WorkoutDetails } from '../components/workouts/WorkoutDetails'
import { WorkoutForm } from '../components/workouts/WorkoutForm'
import { useExercises } from '../hooks/useExercises'
import { useWorkout } from '../hooks/useWorkout'

export function WorkoutDetail() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [isCreatingExercise, setIsCreatingExercise] = useState(false)
  const [isReorderingExercises, setIsReorderingExercises] = useState(false)
  const {
    workout,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    addExercise,
    createAndAddExercise,
    addSetEntry,
    saveWorkout,
    removeWorkout,
    saveAsTemplate,
    saveExercise,
    removeExercise,
    saveSet,
    removeSet,
    addCardio,
    saveCardio,
    removeCardio,
  } = useWorkout(workoutId)
  const {
    exercises,
    isLoading: isLoadingExercises,
    errorMessage: exerciseLibraryError,
    refreshExercises,
  } = useExercises()

  return (
    <section className="PageStack">
      <PageHeader
        title={workout?.title || 'Workout Details'}
        description={
          workout
            ? formatWorkoutDate(workout.workoutDate)
            : 'Workout exercises, strength sets, and cardio duration.'
        }
        actions={
          <div className="RowActions">
            {workout ? (
              <>
                <button
                  className="Button ButtonSecondary"
                  type="button"
                  disabled={isSaving || isEditing || isReorderingExercises}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Details
                </button>
                <button
                  className="Button ButtonSecondary"
                  type="button"
                  disabled={isSaving || isEditing || isReorderingExercises}
                  onClick={() => void saveAsTemplate()}
                >
                  Save as Template
                </button>
                <DeleteButton
                  label="Delete Workout"
                  title="Delete this workout?"
                  description="This permanently deletes the workout, all its exercises, and all logged entries. This cannot be undone."
                  disabled={isSaving || isEditing || isReorderingExercises}
                  onDelete={async () => {
                    const deleted = await removeWorkout()
                    if (deleted) navigate('/workouts', { replace: true })
                    return deleted
                  }}
                />
              </>
            ) : null}
            <Link className="Button ButtonSecondary" to="/workouts">
              Back to Workouts
            </Link>
          </div>
        }
      />

      <ActionFeedback
        errorMessage={
          (isCreatingExercise ? null : errorMessage) ?? exerciseLibraryError
        }
        successMessage={successMessage}
      />

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
          <WorkoutDetails
            onAddCardio={addCardio}
            onSaveCardio={saveCardio}
            onRemoveCardio={removeCardio}
            isSaving={isSaving}
            onAddSet={addSetEntry}
            workout={workout}
            onSaveExercise={saveExercise}
            onRemoveExercise={removeExercise}
            onSaveSet={saveSet}
            onRemoveSet={removeSet}
            isReordering={isReorderingExercises}
            exerciseActions={
              <>
                {!isReorderingExercises ? (
                  <button
                    className={`Button ${isAddingExercise ? 'ButtonSecondary' : 'ButtonPrimary'}`}
                    type="button"
                    aria-expanded={isAddingExercise}
                    aria-controls="add-workout-exercise-panel"
                    disabled={isSaving}
                    onClick={() => {
                      setIsAddingExercise((current) => !current)
                      if (isAddingExercise) setIsCreatingExercise(false)
                    }}
                  >
                    {isAddingExercise ? 'Close' : 'Add Exercise'}
                  </button>
                ) : null}
                {workout.exercises.length > 1 && !isAddingExercise ? (
                  <button
                    className={`Button ${isReorderingExercises ? 'ButtonPrimary' : 'ButtonSecondary'}`}
                    type="button"
                    disabled={isSaving || isEditing}
                    aria-pressed={isReorderingExercises}
                    onClick={() => {
                      if (!isReorderingExercises) {
                        setIsAddingExercise(false)
                        setIsCreatingExercise(false)
                      }
                      setIsReorderingExercises((current) => !current)
                    }}
                  >
                    {isReorderingExercises
                      ? 'Done Reordering'
                      : 'Reorder Exercises'}
                  </button>
                ) : null}
              </>
            }
            addExercisePanel={
              isAddingExercise && !isReorderingExercises ? (
                <div
                  className="AddExercisePanel"
                  id="add-workout-exercise-panel"
                >
                  <AddWorkoutExerciseForm
                    exercises={exercises}
                    isLoadingExercises={isLoadingExercises}
                    isSaving={isSaving}
                    onAdd={addExercise}
                    onCreateNew={() => setIsCreatingExercise(true)}
                    isCreatingExercise={isCreatingExercise}
                  />
                  {isCreatingExercise ? (
                    <div id="create-workout-exercise">
                      {errorMessage ? (
                        <p className="Alert AlertError" role="alert">
                          {errorMessage}
                        </p>
                      ) : null}
                      <ExerciseForm
                        createInWorkout
                        isSaving={isSaving}
                        onCancel={() => setIsCreatingExercise(false)}
                        onCreate={async (request) => {
                          const saved = await createAndAddExercise(request)
                          if (saved) {
                            setIsCreatingExercise(false)
                            await refreshExercises()
                          }
                          return saved
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null
            }
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
