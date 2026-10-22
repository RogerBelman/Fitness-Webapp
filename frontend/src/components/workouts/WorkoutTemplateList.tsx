import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeleteButton } from '../DeleteButton'
import { ExerciseGuidance } from '../ExerciseGuidance'
import { ExerciseMetadata } from '../ExerciseMetadata'
import { ExerciseOptions } from '../ExerciseOptions'
import type { Exercise } from '../../types/exercise'
import type {
  StartTemplateWorkoutRequest,
  WorkoutTemplate,
  WorkoutTemplateRequest,
} from '../../types/workoutTemplate'
import { getTodayDate } from '../../utils/workoutCalendar'

type WorkoutTemplateListProps = {
  templates: WorkoutTemplate[]
  isLoading: boolean
  isSaving: boolean
  onUpdate: (id: number, request: WorkoutTemplateRequest) => Promise<boolean>
  onDelete: (id: number) => Promise<boolean>
  onStart: (
    id: number,
    request: StartTemplateWorkoutRequest,
  ) => Promise<{ id: number } | null>
  exercises: Exercise[]
  isLoadingExercises: boolean
  onAddExercise: (templateId: number, exerciseId: number) => Promise<boolean>
  onMoveExercise: (exerciseId: number, exerciseOrder: number) => Promise<boolean>
  onRemoveExercise: (templateId: number, exerciseId: number) => Promise<boolean>
  editingId: number | null
  onEditingIdChange: (id: number | null) => void
}

export function WorkoutTemplateList({
  templates,
  isLoading,
  isSaving,
  onUpdate,
  onDelete,
  onStart,
  exercises,
  isLoadingExercises,
  onAddExercise,
  onMoveExercise,
  onRemoveExercise,
  editingId,
  onEditingIdChange,
}: WorkoutTemplateListProps) {
  const navigate = useNavigate()
  const [startingId, setStartingId] = useState<number | null>(null)

  return (
    <section className="ContentBand TemplateSection">
      <div className="SectionHeader">
        <div>
          <h2>Saved Templates</h2>
          <p className="SectionDescription">
            Build a reusable routine or save one from an existing workout.
          </p>
        </div>
        <span className="RecordCount">{templates.length}</span>
      </div>

      {isLoading ? <p className="EmptyState">Loading templates...</p> : null}
      {!isLoading && templates.length === 0 ? (
        <p className="EmptyState">
          No templates yet. Create one here or save an existing workout as a
          template.
        </p>
      ) : null}

      {!isLoading && templates.length > 0 ? (
        <div className="TemplateList">
          {templates.map((template) =>
            editingId === template.id ? (
              <TemplateEditor
                key={template.id}
                template={template}
                isSaving={isSaving}
                onCancel={() => onEditingIdChange(null)}
                exercises={exercises}
                isLoadingExercises={isLoadingExercises}
                onAddExercise={(exerciseId) =>
                  onAddExercise(template.id, exerciseId)
                }
                onMoveExercise={onMoveExercise}
                onRemoveExercise={(exerciseId) =>
                  onRemoveExercise(template.id, exerciseId)
                }
                onSave={async (request) => {
                  return onUpdate(template.id, request)
                }}
              />
            ) : (
              <article className="TemplateCard" key={template.id}>
                <div className="TemplateHeader">
                  <div>
                    <h3>{template.name}</h3>
                    <p>
                      {template.exercises.length}{' '}
                      {template.exercises.length === 1 ? 'exercise' : 'exercises'}
                    </p>
                  </div>
                  <div className="RowActions">
                    <button
                      className="Button ButtonPrimary"
                      type="button"
                      disabled={isSaving}
                      aria-expanded={startingId === template.id}
                      aria-controls={`template-start-${template.id}`}
                      onClick={() =>
                        setStartingId((current) =>
                          current === template.id ? null : template.id,
                        )
                      }
                    >
                      Start Workout
                    </button>
                    <button
                      className="Button ButtonSecondary"
                      type="button"
                      disabled={isSaving}
                      onClick={() => {
                        setStartingId(null)
                        onEditingIdChange(template.id)
                      }}
                    >
                      Edit Template
                    </button>
                    <DeleteButton
                      label="Delete Template"
                      title={`Delete ${template.name}?`}
                      description="This removes the reusable template. Workouts created from it remain in your history."
                      disabled={isSaving}
                      onDelete={() => onDelete(template.id)}
                    />
                  </div>
                </div>
                {template.notes ? (
                  <p className="TemplateNotes">{template.notes}</p>
                ) : null}
                {startingId === template.id ? (
                  <StartTemplateWorkoutForm
                    id={`template-start-${template.id}`}
                    template={template}
                    isSaving={isSaving}
                    onCancel={() => setStartingId(null)}
                    onStart={async (request) => {
                      const workout = await onStart(template.id, request)
                      if (!workout) return false
                      navigate(`/workouts/${workout.id}`)
                      return true
                    }}
                  />
                ) : null}
                <ol className="TemplateExercises">
                  {template.exercises.map((item) => (
                    <li key={`${template.id}-${item.exerciseOrder}`}>
                      <div className="TemplateExerciseLabel">
                        <span>{item.exercise.name}</span>
                        <ExerciseMetadata exercise={item.exercise} />
                        <ExerciseGuidance exercise={item.exercise} />
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            ),
          )}
        </div>
      ) : null}
    </section>
  )
}

type StartTemplateWorkoutFormProps = {
  id: string
  template: WorkoutTemplate
  isSaving: boolean
  onCancel: () => void
  onStart: (request: StartTemplateWorkoutRequest) => Promise<boolean>
}

function StartTemplateWorkoutForm({
  id,
  template,
  isSaving,
  onCancel,
  onStart,
}: StartTemplateWorkoutFormProps) {
  const [workoutDate, setWorkoutDate] = useState(getTodayDate())
  const [title, setTitle] = useState(template.name)
  const [notes, setNotes] = useState(template.notes ?? '')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onStart({
      workoutDate,
      title,
      notes,
    })
  }

  return (
    <form className="TemplateStartForm" id={id} onSubmit={submit}>
      <fieldset className="FormFieldset" disabled={isSaving}>
        <div className="TemplateEditorSectionHeader">
          <h4>Start From Template</h4>
          <p>Confirm this session’s details before creating the workout.</p>
        </div>
        <div className="TemplateStartFields">
          <label>
            Workout Date
            <input
              autoFocus
              max={getTodayDate()}
              required
              type="date"
              value={workoutDate}
              onChange={(event) => setWorkoutDate(event.target.value)}
            />
          </label>
          <label>
            <span>
              Workout Title <span className="OptionalLabel">(optional)</span>
            </span>
            <input
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
        </div>
        <label>
          <span>
            Workout Notes <span className="OptionalLabel">(optional)</span>
          </span>
          <textarea
            maxLength={500}
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <p className="ExerciseTrackingHint">
          Changes here apply only to this workout. The template stays the same.
        </p>
        <div className="FormActions TemplateStartActions">
          <button
            className="Button ButtonSecondary"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button className="Button ButtonPrimary" type="submit">
            {isSaving ? 'Starting...' : 'Create Workout'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}

type TemplateEditorProps = {
  template: WorkoutTemplate
  isSaving: boolean
  onSave: (request: WorkoutTemplateRequest) => Promise<boolean>
  onCancel: () => void
  exercises: Exercise[]
  isLoadingExercises: boolean
  onAddExercise: (exerciseId: number) => Promise<boolean>
  onMoveExercise: (exerciseId: number, exerciseOrder: number) => Promise<boolean>
  onRemoveExercise: (exerciseId: number) => Promise<boolean>
}

function TemplateEditor({
  template,
  isSaving,
  onSave,
  onCancel,
  exercises,
  isLoadingExercises,
  onAddExercise,
  onMoveExercise,
  onRemoveExercise,
}: TemplateEditorProps) {
  const [name, setName] = useState(template.name)
  const [notes, setNotes] = useState(template.notes ?? '')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onSave({ name, notes: notes || undefined })
  }

  async function addExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const exerciseId = Number(selectedExerciseId)
    if (!Number.isInteger(exerciseId) || exerciseId <= 0) return
    if (await onAddExercise(exerciseId)) setSelectedExerciseId('')
  }

  return (
    <article className="TemplateEditor">
      <div className="TemplateEditorHeader">
        <div>
          <h3>Edit Template</h3>
          <p>Customize the template used to plan future workouts.</p>
        </div>
        <button
          className="Button ButtonSecondary"
          type="button"
          disabled={isSaving}
          onClick={onCancel}
        >
          Done
        </button>
      </div>

      <form className="FormSurface TemplateDetailsForm" onSubmit={submit}>
        <fieldset className="FormFieldset" disabled={isSaving}>
          <div className="TemplateEditorSectionHeader">
            <h4>Template Details</h4>
            <p>
              Change the name or notes, then choose Save Details.
            </p>
          </div>
          <label>
            Template Name
            <input
              maxLength={120}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            <span>Template Notes <span className="OptionalLabel">(optional)</span></span>
            <textarea
              maxLength={500}
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <div className="FormActions">
            <button className="Button ButtonPrimary" type="submit">
              {isSaving ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </fieldset>
      </form>

      <section className="TemplateExerciseEditor">
        <div className="TemplateEditorSectionHeader">
          <h4>Exercises</h4>
          <p>
            Add, remove, and reorder exercises. These changes save immediately.
          </p>
        </div>
        {template.exercises.length === 0 ? (
          <p className="EmptyState">No exercises in this template yet.</p>
        ) : (
          <ol className="TemplateEditExerciseList">
            {template.exercises.map((item, index) => (
              <li key={item.id}>
                <div className="TemplateExerciseIdentity">
                  <strong>
                    {index + 1}. {item.exercise.name}
                  </strong>
                  <ExerciseMetadata exercise={item.exercise} />
                  <ExerciseGuidance exercise={item.exercise} />
                  {item.exercise.instructions ? (
                    <details>
                      <summary>Instructions</summary>
                      <p>{item.exercise.instructions}</p>
                    </details>
                  ) : null}
                </div>
                <div className="RowActions">
                  <button
                    className="Button ButtonSecondary OrderButton"
                    type="button"
                    disabled={isSaving || index === 0}
                    onClick={() =>
                      void onMoveExercise(
                        item.id,
                        template.exercises[index - 1].exerciseOrder,
                      )
                    }
                  >
                    Move Up
                  </button>
                  <button
                    className="Button ButtonSecondary OrderButton"
                    type="button"
                    disabled={
                      isSaving || index === template.exercises.length - 1
                    }
                    onClick={() =>
                      void onMoveExercise(
                        item.id,
                        template.exercises[index + 1].exerciseOrder,
                      )
                    }
                  >
                    Move Down
                  </button>
                  <button
                    className="Button ButtonDanger"
                    type="button"
                    disabled={isSaving}
                    onClick={() => void onRemoveExercise(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <form className="TemplateAddExercise" onSubmit={addExercise}>
          <label>
            Saved Exercise
            <select
              required
              disabled={isSaving || isLoadingExercises || exercises.length === 0}
              value={selectedExerciseId}
              onChange={(event) => setSelectedExerciseId(event.target.value)}
            >
              <option value="">
                {isLoadingExercises
                  ? 'Loading exercises...'
                  : exercises.length > 0
                    ? 'Choose from your library'
                    : 'No saved exercises yet'}
              </option>
              <ExerciseOptions exercises={exercises} />
            </select>
          </label>
          <button
            className="Button ButtonPrimary"
            type="submit"
            disabled={isSaving || isLoadingExercises || !selectedExerciseId}
          >
            Add Exercise
          </button>
        </form>
      </section>
    </article>
  )
}
