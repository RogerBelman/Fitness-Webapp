import { useEffect, useMemo, useRef, useState } from 'react'
import { ExerciseFilters } from '../components/exercises/ExerciseFilters'
import { ExerciseForm } from '../components/exercises/ExerciseForm'
import { ExerciseList } from '../components/exercises/ExerciseList'
import { PageHeader } from '../components/PageHeader'
import { ActionFeedback } from '../components/ActionFeedback'
import { useExercises } from '../hooks/useExercises'
import { compareExercisesByTrainingTypeAndName } from '../utils/trainingTypeDisplay'

export function ExerciseLibrary() {
  const [isCreating, setIsCreating] = useState(false)
  const createButtonRef = useRef<HTMLButtonElement>(null)
  const shouldRestoreCreateFocus = useRef(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('')
  const [trainingTypeFilter, setTrainingTypeFilter] = useState('')
  const {
    exercises,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    addExercise,
    saveExercise,
    removeExercise,
  } = useExercises('', trainingTypeFilter)

  const visibleExercises = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return exercises
      .filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(normalizedSearch) &&
          (!muscleGroupFilter ||
            exercise.muscleGroup?.toLowerCase() ===
              muscleGroupFilter.toLowerCase()),
      )
      .sort(compareExercisesByTrainingTypeAndName)
  }, [exercises, searchTerm, muscleGroupFilter])

  function handleTrainingTypeChange(trainingType: string) {
    setTrainingTypeFilter(trainingType)
    if (trainingType === 'CARDIO') {
      setMuscleGroupFilter('')
    }
  }

  function closeCreateForm() {
    shouldRestoreCreateFocus.current = true
    setIsCreating(false)
  }

  useEffect(() => {
    if (!isCreating && shouldRestoreCreateFocus.current) {
      createButtonRef.current?.focus()
      shouldRestoreCreateFocus.current = false
    }
  }, [isCreating])

  return (
    <section className="PageStack">
      <PageHeader
        title="Exercise Library"
        description="Manage strength and cardio exercises and their instructions."
        actions={!isCreating ? (
          <button
            ref={createButtonRef}
            className="Button ButtonPrimary"
            type="button"
            aria-expanded="false"
            aria-controls="new-library-exercise"
            disabled={isSaving}
            onClick={() => setIsCreating(true)}
          >
            New Exercise
          </button>
        ) : undefined}
      />

      {isCreating ? (
        <div id="new-library-exercise">
          <ExerciseForm
            isSaving={isSaving}
            onCancel={closeCreateForm}
            onCreate={async (request) => {
              const saved = await addExercise(request)
              if (saved) closeCreateForm()
              return saved
            }}
          />
        </div>
      ) : null}

      <ExerciseFilters
        trainingType={trainingTypeFilter}
        onTrainingTypeChange={handleTrainingTypeChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        muscleGroup={muscleGroupFilter}
        onMuscleGroupChange={setMuscleGroupFilter}
      />

      <ActionFeedback
        errorMessage={errorMessage}
        successMessage={successMessage}
      />

      <ExerciseList
        exercises={visibleExercises}
        isLoading={isLoading}
        isSaving={isSaving}
        onSave={saveExercise}
        onDelete={removeExercise}
      />
    </section>
  )
}
