import { useState } from 'react'
import type { FormEvent } from 'react'
import type {
  UpdateWorkoutExerciseRequest,
  WorkoutExercise,
} from '../../types/workout'

type EditWorkoutExerciseFormProps = {
  exercise: WorkoutExercise
  isSaving: boolean
  onSave: (request: UpdateWorkoutExerciseRequest) => Promise<boolean>
  onCancel: () => void
}

export function EditWorkoutExerciseForm({
  exercise,
  isSaving,
  onSave,
  onCancel,
}: EditWorkoutExerciseFormProps) {
  const [order, setOrder] = useState(String(exercise.exerciseOrder))
  const [notes, setNotes] = useState(exercise.notes ?? '')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave({ exerciseOrder: Number(order), notes })
  }

  return (
    <form className="FormSurface" onSubmit={handleSubmit}>
      <fieldset className="FormFieldset" disabled={isSaving}>
        <label>
          Exercise Order
          <input
            min="1"
            required
            step="1"
            type="number"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
          />
        </label>
        <label>
          Exercise Notes
          <textarea
            maxLength={500}
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <div className="FormActions">
          <button className="Button ButtonPrimary" type="submit">
            {isSaving ? 'Saving...' : 'Save Exercise'}
          </button>
          <button
            className="Button ButtonSecondary"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  )
}
