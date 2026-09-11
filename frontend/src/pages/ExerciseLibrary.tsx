import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createExercise, listExercises } from '../api/exercises'
import { ApiError } from '../api/client'
import { PageHeader } from '../components/PageHeader'
import type { Exercise } from '../types/exercise'

const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']
const categories = ['Strength', 'Bodyweight', 'Cardio']

const emptyForm = {
  name: '',
  muscleGroup: '',
  category: '',
}

export function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadExercises = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const data = await listExercises({
        muscleGroup: muscleGroupFilter || undefined,
        category: categoryFilter || undefined,
      })
      setExercises(data)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [categoryFilter, muscleGroupFilter])

  useEffect(() => {
    void loadExercises()
  }, [loadExercises])

  const visibleExercises = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return exercises
    }

    return exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(normalizedSearch),
    )
  }, [exercises, searchTerm])

  async function handleCreateExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const createdExercise = await createExercise({
        name: form.name,
        muscleGroup: form.muscleGroup,
        category: form.category,
      })

      setForm(emptyForm)
      setSuccessMessage(`${createdExercise.name} was added.`)
      await loadExercises()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="PageStack">
      <PageHeader
        title="Exercise Library"
        description="Manage reusable exercises by muscle group and category."
      />

      <form className="FormSurface" onSubmit={handleCreateExercise}>
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

      <section className="Toolbar" aria-label="Exercise filters">
        <label>
          Search
          <input
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Bench press"
            type="search"
            value={searchTerm}
          />
        </label>

        <label>
          Muscle Group
          <select
            onChange={(event) => setMuscleGroupFilter(event.target.value)}
            value={muscleGroupFilter}
          >
            <option value="">All</option>
            {muscleGroups.map((muscleGroup) => (
              <option key={muscleGroup} value={muscleGroup}>
                {muscleGroup}
              </option>
            ))}
          </select>
        </label>

        <label>
          Category
          <select
            onChange={(event) => setCategoryFilter(event.target.value)}
            value={categoryFilter}
          >
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </section>

      {errorMessage ? <p className="Alert AlertError">{errorMessage}</p> : null}
      {successMessage ? <p className="Alert AlertSuccess">{successMessage}</p> : null}

      <section className="ContentBand">
        <div className="SectionHeader">
          <h2>Exercises</h2>
          <span className="RecordCount">{visibleExercises.length}</span>
        </div>

        {isLoading ? <p className="EmptyState">Loading exercises...</p> : null}

        {!isLoading && visibleExercises.length === 0 ? (
          <p className="EmptyState">No exercises found.</p>
        ) : null}

        {!isLoading && visibleExercises.length > 0 ? (
          <div className="ExerciseList">
            {visibleExercises.map((exercise) => (
              <article className="ExerciseCard" key={exercise.id}>
                <div>
                  <h3>{exercise.name}</h3>
                  <p>{exercise.muscleGroup}</p>
                </div>
                <span>{exercise.category}</span>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return getApiErrorMessage(error)
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

function getApiErrorMessage(error: ApiError) {
  if (isApiErrorDetails(error.details)) {
    return error.details.message
  }

  return `Request failed with status ${error.status}.`
}

function isApiErrorDetails(details: unknown): details is { message: string } {
  return (
    typeof details === 'object' &&
    details !== null &&
    'message' in details &&
    typeof details.message === 'string'
  )
}

