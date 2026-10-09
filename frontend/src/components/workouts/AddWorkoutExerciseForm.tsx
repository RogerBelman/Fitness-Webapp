import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Exercise } from '../../types/exercise'
import type { AddWorkoutExerciseRequest } from '../../types/workout'

type AddWorkoutExerciseFormProps = {
  exercises: Exercise[]
  isLoadingExercises: boolean
  isSaving: boolean
  onAdd: (request: AddWorkoutExerciseRequest) => Promise<boolean>
}

export function AddWorkoutExerciseForm({
  exercises,
  isLoadingExercises,
  isSaving,
  onAdd,
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
          <h2>Add Exercise</h2>
        </div>

        <div className="FormGrid">
          <label>
            Exercise
            <select
              disabled={isLoadingExercises || !hasExercises}
              onChange={(event) => setExerciseId(event.target.value)}
              required
              value={exerciseId}
            >
              <option value="">
                {isLoadingExercises
                  ? 'Loading exercises...'
                  : 'Select exercise'}
              </option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} ({exercise.muscleGroup})
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
            disabled={isSaving || isLoadingExercises || !hasExercises}
            type="submit"
          >
            {isSaving ? 'Adding...' : 'Add Exercise'}
          </button>

          {!isLoadingExercises && !hasExercises ? (
            <Link className="Button ButtonSecondary" to="/exercises">
              Open Exercise Library
            </Link>
          ) : null}
        </div>
      </fieldset>
    </form>
  )
}
