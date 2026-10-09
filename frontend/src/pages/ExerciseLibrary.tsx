import { useMemo, useState } from 'react'
import { ExerciseFilters } from '../components/exercises/ExerciseFilters'
import { ExerciseForm } from '../components/exercises/ExerciseForm'
import { ExerciseList } from '../components/exercises/ExerciseList'
import { PageHeader } from '../components/PageHeader'
import { useExercises } from '../hooks/useExercises'

export function ExerciseLibrary() {
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

    return exercises.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(normalizedSearch) &&
        (!muscleGroupFilter ||
          exercise.muscleGroup?.toLowerCase() ===
            muscleGroupFilter.toLowerCase()),
    )
  }, [exercises, searchTerm, muscleGroupFilter])

  function handleTrainingTypeChange(trainingType: string) {
    setTrainingTypeFilter(trainingType)
    if (trainingType === 'CARDIO') {
      setMuscleGroupFilter('')
    }
  }

  return (
    <section className="PageStack">
      <PageHeader
        title="Exercise Library"
        description="Manage strength and cardio exercises and their instructions."
      />

      <ExerciseForm isSaving={isSaving} onCreate={addExercise} />

      <ExerciseFilters
        trainingType={trainingTypeFilter}
        onTrainingTypeChange={handleTrainingTypeChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        muscleGroup={muscleGroupFilter}
        onMuscleGroupChange={setMuscleGroupFilter}
      />

      {errorMessage ? (
        <p className="Alert AlertError" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="Alert AlertSuccess" role="status">
          {successMessage}
        </p>
      ) : null}

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
