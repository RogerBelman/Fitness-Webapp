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
}

export function ExerciseForm({ isSaving, onCreate }: ExerciseFormProps) {
  const [form, setForm] = useState<ExerciseRequest>(emptyForm)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (await onCreate(form)) {
      setForm(emptyForm)
    }
  }

  return (
    <form className="FormSurface" onSubmit={handleSubmit}>
      <div className="SectionHeader">
        <h2>New Exercise</h2>
      </div>

      <div className="FormGrid">
        <label>
          Name
          <input
            name="name"
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
            onChange={(event) =>
              setForm((current) => ({ ...current, muscleGroup: event.target.value }))
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
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
            placeholder="Strength"
            required
            type="text"
            value={form.category}
          />
        </label>
      </div>

      <div className="FormActions">
        <button className="Button ButtonPrimary" disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : 'Create Exercise'}
        </button>
      </div>
    </form>
  )
}
