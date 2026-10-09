import { useState } from 'react'
import type { FormEvent } from 'react'
import type { WorkoutRequest } from '../../types/workout'

type WorkoutFormValues = {
  workoutDate: string
  title: string
  notes: string
}

type WorkoutFormProps = {
  isSaving: boolean
  onCreate: (request: WorkoutRequest) => Promise<boolean>
  initialValues?: WorkoutFormValues
  onCancel?: () => void
}

export function WorkoutForm({
  isSaving,
  onCreate,
  initialValues,
  onCancel,
}: WorkoutFormProps) {
  const [form, setForm] = useState<WorkoutFormValues>(
    () => initialValues ?? createEmptyForm(),
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const wasCreated = await onCreate({
      workoutDate: form.workoutDate,
      title: form.title || undefined,
      notes: form.notes || undefined,
    })

    if (wasCreated && !initialValues) {
      setForm(createEmptyForm())
    }
  }

  return (
    <form className="FormSurface" onSubmit={handleSubmit}>
      <fieldset className="FormFieldset" disabled={isSaving}>
        <label>
          Workout Date
          <input
            max={getTodayDate()}
            name="workoutDate"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                workoutDate: event.target.value,
              }))
            }
            required
            type="date"
            value={form.workoutDate}
          />
        </label>

        <label>
          Title
          <input
            maxLength={120}
            name="title"
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Push Day"
            type="text"
            value={form.title}
          />
        </label>

        <label>
          Notes
          <textarea
            maxLength={500}
            name="notes"
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Optional workout notes"
            rows={4}
            value={form.notes}
          />
        </label>

        <div className="FormActions">
          <button
            className="Button ButtonPrimary"
            disabled={isSaving}
            type="submit"
          >
            {isSaving
              ? 'Saving...'
              : initialValues
                ? 'Save Workout'
                : 'Create Workout'}
          </button>
          {onCancel ? (
            <button
              className="Button ButtonSecondary"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </fieldset>
    </form>
  )
}

function createEmptyForm(): WorkoutFormValues {
  return {
    workoutDate: getTodayDate(),
    title: '',
    notes: '',
  }
}

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
