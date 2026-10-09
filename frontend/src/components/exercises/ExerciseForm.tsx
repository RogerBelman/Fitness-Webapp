import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ExerciseRequest } from '../../types/exercise'

const emptyForm: ExerciseRequest = {
  name: '',
  muscleGroup: '',
  category: '',
}

type ExerciseFormProps = {
  isSaving: boolean
  onCreate: (request: ExerciseRequest) => Promise<boolean>
  initialValues?: ExerciseRequest
  onCancel?: () => void
}

export function ExerciseForm({
  isSaving,
  onCreate,
  initialValues,
  onCancel,
}: ExerciseFormProps) {
  const [form, setForm] = useState<ExerciseRequest>(() =>
    initialValues
      ? {
          name: initialValues.name,
          muscleGroup: initialValues.muscleGroup,
          category: initialValues.category,
        }
      : emptyForm,
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if ((await onCreate(form)) && !initialValues) {
      setForm(emptyForm)
    }
  }

  return (
    <form className="FormSurface" onSubmit={handleSubmit}>
      <fieldset className="FormFieldset" disabled={isSaving}>
        <div className="SectionHeader">
          <h2>{initialValues ? 'Edit Exercise' : 'New Exercise'}</h2>
        </div>

        <div className="FormGrid">
          <label>
            Name
            <input
              name="name"
              maxLength={120}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Bench Press"
              required
              type="text"
              value={form.name}
            />
          </label>

          <label>
            Muscle Group
            <input
              name="muscleGroup"
              maxLength={80}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  muscleGroup: event.target.value,
                }))
              }
              placeholder="Chest"
              required
              type="text"
              value={form.muscleGroup}
            />
          </label>

          <label>
            Category
            <input
              name="category"
              maxLength={80}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              placeholder="Strength"
              required
              type="text"
              value={form.category}
            />
          </label>
        </div>

        <div className="FormActions">
          <button
            className="Button ButtonPrimary"
            disabled={isSaving}
            type="submit"
          >
            {isSaving
              ? 'Saving...'
              : initialValues
                ? 'Save Exercise'
                : 'Create Exercise'}
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
