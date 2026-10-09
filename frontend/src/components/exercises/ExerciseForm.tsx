import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { ExerciseRequest } from '../../types/exercise'
import {
  getTrainingTypeIcon,
  getTrainingTypeLabel,
} from '../../utils/trainingTypeDisplay'

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
  const formId = useId()
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
    <form
      className="FormSurface ExerciseEditor"
      onSubmit={handleSubmit}
      aria-labelledby={`${formId}-title`}
    >
      <fieldset className="FormFieldset" disabled={isSaving}>
        <header className="ExerciseEditorHeader">
          <h2 id={`${formId}-title`}>
            {initialValues ? 'Edit Exercise' : 'New Exercise'}
          </h2>
          <p>
            {createInWorkout
              ? 'Save to your library and add to this workout.'
              : 'Set up the exercise once. Log your performance in a workout.'}
          </p>
        </header>

        <fieldset className="ExerciseTypePicker">
          <legend>Training Type</legend>
          <div className="ExerciseTypeOptions">
            {(['STRENGTH', 'CARDIO'] as const).map((type) => (
              <label className="ExerciseTypeOption" key={type}>
                <input
                  type="radio"
                  name={`${formId}-trainingType`}
                  value={type}
                  checked={form.trainingType === type}
                  onChange={() =>
                    setForm((current) => ({ ...current, trainingType: type }))
                  }
                />
                <span className="ExerciseTypeOptionIcon" aria-hidden="true">
                  {getTrainingTypeIcon(type)}
                </span>
                <span>
                  <strong>{getTrainingTypeLabel(type)}</strong>
                  <small>
                    {type === 'STRENGTH'
                      ? 'Sets, reps & weight'
                      : 'Duration & machine level'}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div
          className={`ExerciseDetailsGrid${isCardio ? ' ExerciseDetailsGridSingle' : ''}`}
        >
          <label>
            Exercise Name
            <input
              autoFocus
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

        <label>
          <span>
            Instructions <span className="OptionalLabel">(optional)</span>
          </span>
          <textarea
            name="instructions"
            maxLength={500}
            rows={3}
            placeholder="Reusable setup and technique cues, shown each time you use this exercise."
            value={form.instructions ?? ''}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                instructions: event.target.value,
              }))
            }
          />
        </label>

        <p className="ExerciseTrackingHint" role="status">
          {isCardio
            ? 'In a workout, log duration in minutes and an optional machine level.'
            : 'In a workout, log sets, reps, and weight.'}
        </p>
        {initialValues ? (
          <p className="ExerciseTrackingHint">
            Library changes appear in past workouts too. Training type can only
            change before any sets or cardio entries are logged.
          </p>
        ) : null}

        <div className="FormActions ExerciseEditorActions">
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
                ? 'Save Exercise'
                : createInWorkout
                  ? 'Create & Add to Workout'
                  : 'Create Exercise'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
