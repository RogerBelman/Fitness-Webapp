import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Exercise } from '../../types/exercise'
import type { AddWorkoutExerciseRequest } from '../../types/workout'

type AddWorkoutExerciseFormProps = {
  exercises: Exercise[]
  isLoadingExercises: boolean
  isSaving: boolean
  onAdd: (request: AddWorkoutExerciseRequest) => Promise<boolean>
  onCreateNew: () => void
  isCreatingExercise: boolean
}

export function AddWorkoutExerciseForm({
  exercises,
  isLoadingExercises,
  isSaving,
  onAdd,
  onCreateNew,
  isCreatingExercise,
}: AddWorkoutExerciseFormProps) {
  const [exerciseId, setExerciseId] = useState('')
  const [notes, setNotes] = useState('')
  const hasExercises = exercises.length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const wasAdded = await onAdd({
      exerciseId: Number(exerciseId),
      notes: notes || undefined,
    })

    if (wasAdded) {
      setExerciseId('')
      setNotes('')
    }
  }

  return (
    <form className="FormSurface WorkoutExerciseForm" onSubmit={handleSubmit}>
      <fieldset className="FormFieldset" disabled={isSaving}>
        <div className="SectionHeader">
          <h2>Add From Your Library</h2>
        </div>

        <div className="FormGrid">
          <label>
            Saved Exercise
            <select
              disabled={isLoadingExercises || !hasExercises}
              onChange={(event) => setExerciseId(event.target.value)}
              required
              value={exerciseId}
            >
              <option value="">
                {isLoadingExercises
                  ? 'Loading exercises...'
                  : hasExercises
                    ? 'Choose from your library'
                    : 'No saved exercises yet'}
              </option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} (
                  {exercise.trainingType === 'CARDIO'
                    ? 'Cardio'
                    : exercise.muscleGroup || 'Strength'}
                  )
                </option>
              ))}
            </select>
          </label>

          <label>
            Notes
            <input
              maxLength={500}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional exercise notes"
              type="text"
              value={notes}
            />
          </label>
        </div>

        <div className="FormActions">
          <button
            className="Button ButtonPrimary"
            disabled={isSaving || isLoadingExercises || !exerciseId}
            type="submit"
          >
            {isSaving ? 'Adding...' : 'Add to Workout'}
          </button>
        </div>

        <div className="NewExerciseOption">
          <div>
            <h3>Not in your library?</h3>
            <p id="new-exercise-help">
              Create a new exercise, save it to your library, and add it to this
              workout.
            </p>
          </div>
          <button
            className="Button ButtonSecondary"
            type="button"
            disabled={isSaving || isCreatingExercise}
            aria-expanded={isCreatingExercise}
            aria-controls="create-workout-exercise"
            aria-describedby="new-exercise-help"
            onClick={onCreateNew}
          >
            Create New Exercise
          </button>
        </div>
      </fieldset>
    </form>
  )
}
