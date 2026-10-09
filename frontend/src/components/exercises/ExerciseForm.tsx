import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ExerciseRequest, TrainingType } from '../../types/exercise'

const emptyForm: ExerciseRequest = {
  trainingType: 'STRENGTH',
  name: '',
  muscleGroup: '',
  instructions: '',
}

type ExerciseFormProps = {
  isSaving: boolean
  onCreate: (request: ExerciseRequest) => Promise<boolean>
  initialValues?: ExerciseRequest
  onCancel?: () => void
  createInWorkout?: boolean
}

export function ExerciseForm({
  isSaving,
  onCreate,
  initialValues,
  onCancel,
  createInWorkout = false,
}: ExerciseFormProps) {
  const [form, setForm] = useState<ExerciseRequest>(() =>
    initialValues
      ? {
          name: initialValues.name,
          trainingType: initialValues.trainingType,
          muscleGroup: initialValues.muscleGroup,
          category: initialValues.category,
          instructions: initialValues.instructions ?? '',
        }
      : emptyForm,
  )
  const isCardio = form.trainingType === 'CARDIO'

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
          <h2>
            {initialValues ? 'Edit' : 'New'} {isCardio ? 'Cardio' : 'Strength'}{' '}
            Exercise
          </h2>
        </div>

        <div className="FormGrid">
          <label>
            Training Type
            <select
              autoFocus={createInWorkout}
              value={form.trainingType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  trainingType: event.target.value as TrainingType,
                }))
              }
            >
              <option value="STRENGTH">Strength — sets, reps, weight</option>
              <option value="CARDIO">Cardio — duration, level</option>
            </select>
          </label>
          <label>
            Name
            <input
              name="name"
              maxLength={120}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder={isCardio ? 'Stationary Bike' : 'Bench Press'}
              required
              type="text"
              value={form.name}
            />
          </label>

          {!isCardio ? (
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
          ) : null}
        </div>

        <div className="ExerciseTrackingInfo" role="status">
          <strong>{isCardio ? 'Cardio tracking' : 'Strength tracking'}</strong>
          <p>
            {isCardio
              ? 'Duration (minutes) and optional machine level are recorded each time you perform this exercise.'
              : 'Sets, reps, and weight are recorded each time you perform this exercise.'}
          </p>
          <p>
            {createInWorkout
              ? 'Create this exercise to save it in your library and start logging it in this workout.'
              : 'Save this exercise, then add it to a workout to enter those values.'}
          </p>
        </div>

        <label>
          Instructions
          <textarea
            name="instructions"
            maxLength={500}
            rows={4}
            placeholder="Equipment details, setup, grip, technique, or cues to remember."
            value={form.instructions ?? ''}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                instructions: event.target.value,
              }))
            }
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
                ? 'Save Exercise'
                : createInWorkout
                  ? 'Create & Add to Workout'
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
