import { useState } from 'react'
import { createWorkout } from '../api/workouts'
import { ApiError } from '../api/client'
import { PageHeader } from '../components/PageHeader'
import { WorkoutForm } from '../components/workouts/WorkoutForm'
import type { WorkoutRequest } from '../types/workout'

export function NewWorkout() {
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleCreate(request: WorkoutRequest): Promise<boolean> {
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const workout = await createWorkout(request)
      setSuccessMessage(`Workout ${workout.id} was created for ${workout.workoutDate}.`)
      return true
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="PageStack">
      <PageHeader
        title="New Workout"
        description="Start a workout session and add exercises."
      />

      <WorkoutForm isSaving={isSaving} onCreate={handleCreate} />

      {errorMessage ? <p className="Alert AlertError">{errorMessage}</p> : null}
      {successMessage ? <p className="Alert AlertSuccess">{successMessage}</p> : null}
    </section>
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (isApiErrorDetails(error.details)) {
      return error.details.message
    }

    return `Request failed with status ${error.status}.`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

function isApiErrorDetails(details: unknown): details is { message: string } {
  return (
    typeof details === 'object' &&
    details !== null &&
    'message' in details &&
    typeof details.message === 'string'
  )
}
