import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createExercise,
  listExercises,
  updateExercise,
  deleteExercise,
} from '../api/exercises'
import { ApiError } from '../api/client'
import type { Exercise, ExerciseRequest } from '../types/exercise'

export function useExercises(muscleGroup = '', trainingType = '') {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const saving = useRef(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadExercises = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const data = await listExercises({
        trainingType: trainingType || undefined,
        muscleGroup: muscleGroup || undefined,
      })
      setExercises(data)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [muscleGroup, trainingType])

  useEffect(() => {
    void loadExercises()
  }, [loadExercises])

  async function addExercise(request: ExerciseRequest): Promise<boolean> {
    return mutate(() => createExercise(request), 'Exercise added.')
  }

  async function mutate(
    action: () => Promise<unknown>,
    message: string,
  ): Promise<boolean> {
    if (saving.current) return false
    saving.current = true
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await action()
      setSuccessMessage(message)
      await loadExercises()
      return true
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      return false
    } finally {
      saving.current = false
      setIsSaving(false)
    }
  }

  return {
    exercises,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    refreshExercises: loadExercises,
    addExercise,
    saveExercise: (id: number, request: ExerciseRequest) =>
      mutate(() => updateExercise(id, request), 'Exercise updated.'),
    removeExercise: (id: number) =>
      mutate(() => deleteExercise(id), 'Exercise deleted.'),
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (isApiErrorDetails(error.details)) {
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
