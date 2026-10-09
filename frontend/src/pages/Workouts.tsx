import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { createWorkout } from '../api/workouts'
import { PageHeader } from '../components/PageHeader'
import { WorkoutForm } from '../components/workouts/WorkoutForm'
import { WorkoutList } from '../components/workouts/WorkoutList'
import { useWorkouts } from '../hooks/useWorkouts'
import type { WorkoutRequest } from '../types/workout'
import { getInitialWorkoutDate } from '../utils/workoutCalendar'

export function Workouts() {
  const { workouts, isLoading, errorMessage, reloadWorkouts } = useWorkouts()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const saving = useRef(false)
  const isCreating = searchParams.get('new') === '1'
  const initialDate = getInitialWorkoutDate(searchParams.get('date'))

  function openCreator() {
    setCreateError(null)
    const params = new URLSearchParams(searchParams)
    params.set('new', '1')
    setSearchParams(params)
  }

  function closeCreator() {
    setCreateError(null)
    const params = new URLSearchParams(searchParams)
    params.delete('new')
    params.delete('date')
    setSearchParams(params, { replace: true })
  }

  async function handleCreate(request: WorkoutRequest): Promise<boolean> {
    if (saving.current) return false
    saving.current = true
    setIsSaving(true)
    setCreateError(null)
    try {
      const workout = await createWorkout(request)
      navigate(`/workouts/${workout.id}`, { replace: true })
      return true
    } catch (error) {
      setCreateError(getErrorMessage(error))
      return false
    } finally {
      saving.current = false
      setIsSaving(false)
    }
  }

  return (
    <section className="PageStack">
      <PageHeader
        title="Workouts"
        description="Start a workout or revisit a past session."
        actions={
          <button
            className="Button ButtonPrimary"
            type="button"
            disabled={isCreating}
            aria-expanded={isCreating}
            aria-controls={isCreating ? 'new-workout-panel' : undefined}
            onClick={openCreator}
          >
            New Workout
          </button>
        }
      />

      {isCreating ? (
        <section
          className="WorkoutCreatePanel"
          id="new-workout-panel"
          aria-labelledby="new-workout-heading"
        >
          <div className="SectionHeader">
            <h2 id="new-workout-heading">New Workout</h2>
          </div>
          <p className="EmptyState">
            Choose a date and title, then open your workout to log strength and
            cardio exercises.
          </p>
          {createError ? (
            <p className="Alert AlertError" role="alert">
              {createError}
            </p>
          ) : null}
          <WorkoutForm
            key={initialDate}
            initialDate={initialDate}
            isSaving={isSaving}
            onCreate={handleCreate}
            onCancel={closeCreator}
          />
        </section>
      ) : null}

      {errorMessage ? (
        <div className="Alert AlertError DashboardError" role="alert">
          <p>{errorMessage}</p>
          <button
            className="Button ButtonSecondary"
            type="button"
            onClick={reloadWorkouts}
          >
            Try Again
          </button>
        </div>
      ) : (
        <WorkoutList workouts={workouts} isLoading={isLoading} />
      )}
    </section>
  )
}

function getErrorMessage(error: unknown) {
  if (
    error instanceof ApiError &&
    typeof error.details === 'object' &&
    error.details !== null
  ) {
    if (
      'fieldErrors' in error.details &&
      typeof error.details.fieldErrors === 'object' &&
      error.details.fieldErrors !== null
    ) {
      const messages = Object.values(error.details.fieldErrors).filter(
        (value): value is string => typeof value === 'string',
      )
      if (messages.length > 0) return messages.join(' ')
    }
    if ('message' in error.details && typeof error.details.message === 'string')
      return error.details.message
  }
  return error instanceof Error
    ? error.message
    : 'Could not create the workout.'
}
