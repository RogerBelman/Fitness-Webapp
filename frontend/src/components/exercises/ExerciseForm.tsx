import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { ExerciseRequest, MovementType } from '../../types/exercise'
import { TrainingTypeBadge } from '../TrainingTypeBadge'
import { MUSCLE_GROUPS } from '../../utils/muscleGroups'
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
          muscleGroup: MUSCLE_GROUPS.find((group) => group.toLowerCase() === initialValues.muscleGroup?.trim().toLowerCase()) ?? '',
          muscleFocus: initialValues.muscleFocus ?? '',
          category: initialValues.category,
          instructions: initialValues.instructions ?? '',
          movementType: initialValues.movementType ?? null,
          targetWorkingSets: initialValues.targetWorkingSets ?? null,
          repRangeMin: initialValues.repRangeMin ?? null,
          repRangeMax: initialValues.repRangeMax ?? null,
          durationMinMinutes: initialValues.durationMinMinutes ?? null,
          durationMaxMinutes: initialValues.durationMaxMinutes ?? null,
        }
      : emptyForm,
  )
  const isCardio = form.trainingType === 'CARDIO'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const request: ExerciseRequest = {
      ...form,
      muscleGroup: isCardio ? '' : form.muscleGroup,
      muscleFocus: isCardio ? null : form.muscleFocus?.trim() || null,
      movementType: isCardio ? null : form.movementType ?? null,
      targetWorkingSets: isCardio ? null : form.targetWorkingSets ?? null,
      repRangeMin: isCardio ? null : form.repRangeMin ?? null,
      repRangeMax: isCardio ? null : form.repRangeMax ?? null,
      durationMinMinutes: isCardio ? form.durationMinMinutes ?? null : null,
      durationMaxMinutes: isCardio ? form.durationMaxMinutes ?? null : null,
    }
    if ((await onCreate(request)) && !initialValues) {
      setForm(emptyForm)
    }
  }

  return (
    <form
      className="FormSurface EditorPanel ExerciseEditor"
      onSubmit={handleSubmit}
      aria-labelledby={`${formId}-title`}
    >
      <fieldset className="FormFieldset" disabled={isSaving}>
        <header className="EditorPanelHeader ExerciseEditorHeader">
          <h2 id={`${formId}-title`}>
            {initialValues ? 'Edit Exercise' : 'New Exercise'}
          </h2>
          <p>
            {initialValues
              ? 'Library changes appear in past workouts too.'
              : createInWorkout
                ? 'Save to your library and add to this workout.'
                : 'Set up the exercise once. Log your performance in a workout.'}
          </p>
        </header>

        <fieldset className="ExerciseTypePicker">
          <legend>Training Type</legend>
          {initialValues ? (
            <div className="ExerciseTypeSummary">
              <TrainingTypeBadge trainingType={form.trainingType} />
            </div>
          ) : (
            <div className="ExerciseTypeOptions">
              {(['STRENGTH', 'CARDIO'] as const).map((type) => (
                <label className="ExerciseTypeOption" key={type}>
                  <input
                    type="radio"
                    name={`${formId}-trainingType`}
                    value={type}
                    checked={form.trainingType === type}
                    onChange={() =>
                      setForm((current) => ({
                        ...current, trainingType: type,
                        muscleGroup: type === 'CARDIO' ? '' : current.muscleGroup,
                        muscleFocus: type === 'CARDIO' ? null : current.muscleFocus,
                        movementType: type === 'CARDIO' ? null : current.movementType,
                        targetWorkingSets: type === 'CARDIO' ? null : current.targetWorkingSets,
                        repRangeMin: type === 'CARDIO' ? null : current.repRangeMin,
                        repRangeMax: type === 'CARDIO' ? null : current.repRangeMax,
                        durationMinMinutes: type === 'STRENGTH' ? null : current.durationMinMinutes,
                        durationMaxMinutes: type === 'STRENGTH' ? null : current.durationMaxMinutes,
                      }))
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
          )}
        </fieldset>

        <div
          className={`ExerciseDetailsGrid${isCardio ? ' ExerciseDetailsGridSingle' : ''}`}
        >
          <label className="ExerciseNameField">
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
              <select
                name="muscleGroup"
                onChange={(event) => setForm((current) => ({
                  ...current, muscleGroup: event.target.value,
                }))}
                required
                value={form.muscleGroup}
              >
                <option value="">Choose a muscle group</option>
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </label>
          ) : null}
          {!isCardio ? (
            <label>
              <span>Muscle Focus <span className="OptionalLabel">(optional)</span></span>
              <input
                name="muscleFocus"
                maxLength={80}
                type="text"
                placeholder="Upper Chest"
                value={form.muscleFocus ?? ''}
                onChange={(event) => setForm((current) => ({
                  ...current, muscleFocus: event.target.value,
                }))}
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

        <fieldset className="ExerciseDefaultsFields">
          <legend>Training Defaults</legend>
          <p className="ExerciseDefaultsHint">Optional guidance shared across workouts and templates. You can log performance outside these targets.</p>
          {!isCardio ? (
            <label>
              Movement Type
              <select value={form.movementType ?? ''} onChange={(event) => setForm((current) => ({
                ...current, movementType: (event.target.value || null) as MovementType | null,
              }))}>
                <option value="">Not specified</option>
                <option value="COMPOUND">Compound</option>
                <option value="ISOLATION">Isolation</option>
              </select>
            </label>
          ) : null}
          {!isCardio ? (
            <label>
              Target Working Sets
              <input type="number" min="1" max="2147483647" step="1"
                value={form.targetWorkingSets ?? ''}
                onChange={(event) => setForm((current) => ({ ...current,
                  targetWorkingSets: event.target.value === '' ? null : Number(event.target.value),
                }))} />
            </label>
          ) : null}
          <div className="ExerciseRangeFields">
            {isCardio ? <>
              <label>Minimum minutes
                <input type="number" min="0.01" max="99999.99" step="0.01"
                  value={form.durationMinMinutes ?? ''} placeholder="Optional"
                  onChange={(event) => setForm((current) => ({ ...current,
                    durationMinMinutes: event.target.value === '' ? null : Number(event.target.value),
                  }))} />
              </label>
              <label>Maximum minutes
                <input type="number" min={form.durationMinMinutes ?? 0.01} max="99999.99" step="0.01"
                  value={form.durationMaxMinutes ?? ''} placeholder="Optional"
                  onChange={(event) => setForm((current) => ({ ...current,
                    durationMaxMinutes: event.target.value === '' ? null : Number(event.target.value),
                  }))} />
              </label>
            </> : <>
              <label>Minimum reps
                <input type="number" min="1" max="2147483647" step="1"
                  value={form.repRangeMin ?? ''} required={form.repRangeMax != null}
                  onChange={(event) => setForm((current) => ({ ...current,
                    repRangeMin: event.target.value === '' ? null : Number(event.target.value),
                  }))} />
              </label>
              <label>Maximum reps
                <input type="number" min={form.repRangeMin ?? 1} max="2147483647" step="1"
                  value={form.repRangeMax ?? ''} required={form.repRangeMin != null}
                  onChange={(event) => setForm((current) => ({ ...current,
                    repRangeMax: event.target.value === '' ? null : Number(event.target.value),
                  }))} />
              </label>
            </>}
          </div>
        </fieldset>

        <div className="FormActions EditorPanelActions ExerciseEditorActions">
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
