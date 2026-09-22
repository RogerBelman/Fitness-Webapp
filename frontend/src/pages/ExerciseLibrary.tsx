import { useMemo, useState } from 'react'
import { ExerciseFilters } from '../components/exercises/ExerciseFilters'
import { ExerciseForm } from '../components/exercises/ExerciseForm'
import { ExerciseList } from '../components/exercises/ExerciseList'
import { PageHeader } from '../components/PageHeader'
import { useExercises } from '../hooks/useExercises'

export function ExerciseLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const {
    exercises,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    addExercise,
  } = useExercises(muscleGroupFilter, categoryFilter)

  const visibleExercises = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return exercises
    }

    return exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(normalizedSearch),
    )
  }, [exercises, searchTerm])

  return (
    <section className="PageStack">
      <PageHeader
        title="Exercise Library"
        description="Manage reusable exercises by muscle group and category."
      />

      <ExerciseForm isSaving={isSaving} onCreate={addExercise} />

      <ExerciseFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        muscleGroup={muscleGroupFilter}
        onMuscleGroupChange={setMuscleGroupFilter}
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      {errorMessage ? <p className="Alert AlertError">{errorMessage}</p> : null}
      {successMessage ? <p className="Alert AlertSuccess">{successMessage}</p> : null}

      <ExerciseList exercises={visibleExercises} isLoading={isLoading} />
    </section>
  )
}
