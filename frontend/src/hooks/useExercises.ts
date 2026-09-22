import { useCallback, useEffect, useState } from 'react'
import { createExercise, listExercises } from '../api/exercises'
import { ApiError } from '../api/client'
import type { Exercise, ExerciseRequest } from '../types/exercise'

export function useExercises(muscleGroup: string, category: string) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadExercises = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const data = await listExercises({
        muscleGroup: muscleGroup || undefined,
        category: category || undefined,
      })
      setExercises(data)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [category, muscleGroup])

  useEffect(() => {
    void loadExercises()
  }, [loadExercises])

  async function addExercise(request: ExerciseRequest): Promise<boolean> {
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const createdExercise = await createExercise(request)
      setSuccessMessage(`${createdExercise.name} was added.`)
      await loadExercises()
      return true
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    exercises,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    addExercise,
  }
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
