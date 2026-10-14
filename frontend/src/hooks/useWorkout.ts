import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import * as api from '../api/workouts'
import { createTemplateFromWorkout } from '../api/workoutTemplates'
import type { ExerciseRequest } from '../types/exercise'
import type {
  AddWorkoutExerciseRequest,
  CardioEntryRequest,
  SetEntryRequest,
  UpdateWorkoutExerciseRequest,
  WorkoutDetail,
  WorkoutRequest,
} from '../types/workout'

export function useWorkout(workoutId: string | undefined) {
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const saving = useRef(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const id = parseWorkoutId(workoutId)

  useEffect(() => {
    let active = true
    setWorkout(null)
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    if (id === null) {
      setErrorMessage('Workout ID is invalid.')
      setIsLoading(false)
      return
    }
    api
      .getWorkout(id)
      .then((data) => {
        if (active) setWorkout(data)
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(getErrorMessage(error))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  async function mutate(
    action: () => Promise<unknown>,
    message: string,
    refresh = true,
  ): Promise<boolean> {
    if (id === null || saving.current) return false
    saving.current = true
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      await action()
      setSuccessMessage(message)
      if (refresh) {
        try {
          setWorkout(await api.getWorkout(id))
        } catch (error) {
          setErrorMessage(
            `Change saved, but the workout could not be refreshed: ${getErrorMessage(error)}`,
          )
        }
      }
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
    workout,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    createAndAddExercise: (request: ExerciseRequest) =>
      mutate(
        () => api.createAndAddWorkoutExercise(id!, request),
        'Exercise created and added to the workout.',
      ),
    addExercise: (request: AddWorkoutExerciseRequest) =>
      mutate(
        () => api.addWorkoutExercise(id!, request),
        'Exercise added to the workout.',
      ),
    addSetEntry: (exerciseId: number, request: SetEntryRequest) =>
      mutate(() => api.addSet(exerciseId, request), 'Set added.'),
    saveWorkout: (request: WorkoutRequest) =>
      mutate(() => api.updateWorkout(id!, request), 'Workout updated.'),
    removeWorkout: () =>
      mutate(() => api.deleteWorkout(id!), 'Workout deleted.', false),
    saveAsTemplate: () =>
      mutate(
        () => createTemplateFromWorkout(id!),
        'Workout saved as a template.',
        false,
      ),
    saveExercise: (exerciseId: number, request: UpdateWorkoutExerciseRequest) =>
      mutate(
        () => api.updateWorkoutExercise(exerciseId, request),
        'Exercise order updated.',
      ),
    removeExercise: (exerciseId: number) =>
      mutate(
        () => api.deleteWorkoutExercise(exerciseId),
        'Exercise and its logged entries removed from the workout.',
      ),
    saveSet: (setId: number, request: SetEntryRequest) =>
      mutate(() => api.updateSet(setId, request), 'Set updated.'),
    removeSet: (setId: number) =>
      mutate(() => api.deleteSet(setId), 'Set deleted.'),
    addCardio: (exerciseId: number, request: CardioEntryRequest) =>
      mutate(
        () => api.addCardioEntry(exerciseId, request),
        'Cardio entry added.',
      ),
    saveCardio: (entryId: number, request: CardioEntryRequest) =>
      mutate(
        () => api.updateCardioEntry(entryId, request),
        'Cardio entry updated.',
      ),
    removeCardio: (entryId: number) =>
      mutate(() => api.deleteCardioEntry(entryId), 'Cardio entry deleted.'),
  }
}

function parseWorkoutId(workoutId: string | undefined) {
  const id = Number(workoutId)
  return workoutId && Number.isInteger(id) && id > 0 ? id : null
}

function getErrorMessage(error: unknown) {
  if (
    error instanceof ApiError &&
    typeof error.details === 'object' &&
    error.details !== null &&
    'message' in error.details &&
    typeof error.details.message === 'string'
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
    return error.details.message
  }
  return error instanceof Error
    ? error.message
    : 'Could not update the workout.'
}
