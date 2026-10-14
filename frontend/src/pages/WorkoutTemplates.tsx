import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ActionFeedback } from '../components/ActionFeedback'
import { PageHeader } from '../components/PageHeader'
import { WorkoutTemplateList } from '../components/workouts/WorkoutTemplateList'
import { WorkoutTemplateForm } from '../components/workouts/WorkoutTemplateForm'
import { useExercises } from '../hooks/useExercises'
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates'

export function WorkoutTemplates() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const createButtonRef = useRef<HTMLButtonElement>(null)
  const restoreCreateFocus = useRef(false)
  const {
    templates,
    isLoading,
    isSaving,
    errorMessage: templateError,
    successMessage,
    createTemplate,
    updateTemplate,
    addExercise,
    moveExercise,
    removeExercise,
    deleteTemplate,
    startWorkout,
  } = useWorkoutTemplates()
  const {
    exercises,
    isLoading: isLoadingExercises,
    errorMessage: exerciseError,
  } = useExercises()

  function closeCreateForm() {
    restoreCreateFocus.current = true
    setIsCreating(false)
  }

  useEffect(() => {
    if (!isCreating && restoreCreateFocus.current && editingId === null) {
      createButtonRef.current?.focus()
      restoreCreateFocus.current = false
    }
  }, [editingId, isCreating])

  return (
    <section className="PageStack">
      <PageHeader
        title="Workout Templates"
        description="Manage reusable routines and start a new workout from one."
        actions={!isCreating ? (
          <>
            <Link className="Button ButtonSecondary" to="/workouts">
              Back to Workouts
            </Link>
            <button
              ref={createButtonRef}
              className="Button ButtonPrimary"
              type="button"
              disabled={isSaving}
              aria-expanded="false"
              aria-controls="new-template-panel"
              onClick={() => {
                setEditingId(null)
                setIsCreating(true)
              }}
            >
              New Template
            </button>
          </>
        ) : undefined}
      />

      {isCreating ? (
        <div id="new-template-panel">
          <WorkoutTemplateForm
            isSaving={isSaving}
            onCancel={closeCreateForm}
            onCreate={async (request) => {
              const created = await createTemplate(request)
              if (!created) return false
              setIsCreating(false)
              restoreCreateFocus.current = false
              setEditingId(created.id)
              return true
            }}
          />
        </div>
      ) : null}

      <ActionFeedback
        errorMessage={templateError ?? exerciseError}
        successMessage={successMessage}
      />

      <WorkoutTemplateList
        templates={templates}
        isLoading={isLoading}
        isSaving={isSaving}
        onUpdate={updateTemplate}
        onDelete={deleteTemplate}
        onStart={startWorkout}
        exercises={exercises}
        isLoadingExercises={isLoadingExercises}
        onAddExercise={addExercise}
        onMoveExercise={moveExercise}
        onRemoveExercise={removeExercise}
        editingId={editingId}
        onEditingIdChange={setEditingId}
      />
    </section>
  )
}
