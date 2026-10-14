import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  const createButtonRef = useRef<HTMLButtonElement>(null)
  const shouldRestoreCreateFocus = useRef(false)
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
    shouldRestoreCreateFocus.current = true
    const params = new URLSearchParams(searchParams)
    params.delete('new')
    params.delete('date')
    setSearchParams(params, { replace: true })
  }

  useEffect(() => {
    if (!isCreating && shouldRestoreCreateFocus.current) {
      createButtonRef.current?.focus()
      shouldRestoreCreateFocus.current = false
    }
  }, [isCreating])

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
          !isCreating ? (
            <>
              <Link className="Button ButtonSecondary" to="/workouts/templates">
                Manage Templates
              </Link>
              <button
                ref={createButtonRef}
                className="Button ButtonPrimary"
                type="button"
                aria-expanded="false"
                aria-controls="new-workout-panel"
                onClick={openCreator}
              >
                New Workout
              </button>
            </>
          ) : undefined
        }
      />

      {isCreating ? (
        <div className="WorkoutCreatePanel" id="new-workout-panel">
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
        </div>
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
