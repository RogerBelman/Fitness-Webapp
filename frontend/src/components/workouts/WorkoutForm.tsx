import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { WorkoutRequest } from '../../types/workout'
import { getTodayDate } from '../../utils/workoutCalendar'

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
  initialDate?: string
}

export function WorkoutForm({
  isSaving,
  onCreate,
  initialValues,
  onCancel,
  initialDate,
}: WorkoutFormProps) {
  const formId = useId()
  const [form, setForm] = useState<WorkoutFormValues>(
    () =>
      initialValues ?? {
        ...createEmptyForm(),
        workoutDate: initialDate ?? getTodayDate(),
      },
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
    <form
      className="FormSurface EditorPanel WorkoutEditor"
      onSubmit={handleSubmit}
      aria-labelledby={`${formId}-title`}
    >
      <fieldset className="FormFieldset" disabled={isSaving}>
        <header className="EditorPanelHeader">
          <h2 id={`${formId}-title`}>
            {initialValues ? 'Edit Workout Details' : 'New Workout'}
          </h2>
          <p>
            {initialValues
              ? 'Update the workout date, title, or session notes.'
              : 'Choose a date and optional title. You can add exercises after creating it.'}
          </p>
        </header>

        <div className="ExerciseDetailsGrid">
          <label>
            Workout Date
            <input
              autoFocus={!initialValues}
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
            <span>
              Title <span className="OptionalLabel">(optional)</span>
            </span>
            <input
              maxLength={120}
              name="title"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Push Day"
              type="text"
              value={form.title}
            />
          </label>
        </div>

        <label>
          <span>
            Workout Notes <span className="OptionalLabel">(optional)</span>
          </span>
          <textarea
            maxLength={500}
            name="notes"
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="How the workout felt, goals, or anything to remember"
            rows={4}
            value={form.notes}
          />
        </label>

        <p className="ExerciseTrackingHint">
          Workout notes apply only to this session and can be edited later.
        </p>

        <div className="FormActions EditorPanelActions">
          {onCancel ? (
            <button
              className="Button ButtonSecondary"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
          ) : null}
          <button
            className="Button ButtonPrimary"
            disabled={isSaving}
            type="submit"
          >
            {isSaving
              ? 'Saving...'
              : initialValues
                ? 'Save Details'
                : 'Create Workout'}
          </button>
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
