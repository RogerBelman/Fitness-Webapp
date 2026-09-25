import { useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { getWorkout } from '../api/workouts'
import type { WorkoutDetail } from '../types/workout'

export function useWorkout(workoutId: string | undefined) {
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const id = Number(workoutId)

    if (!workoutId || !Number.isInteger(id) || id <= 0) {
      setWorkout(null)
      setErrorMessage('Workout ID is invalid.')
      setIsLoading(false)
      return
    }

    async function loadWorkout() {
      setWorkout(null)
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const data = await getWorkout(id)
        setWorkout(data)
      } catch (error) {
        setErrorMessage(getErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    }

    void loadWorkout()
  }, [workoutId])

  return { workout, isLoading, errorMessage }
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && isApiErrorDetails(error.details)) {
    return error.details.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Could not load workout details.'
}

function isApiErrorDetails(details: unknown): details is { message: string } {
  return (
    typeof details === 'object' &&
    details !== null &&
    'message' in details &&
    typeof details.message === 'string'
  )
}
