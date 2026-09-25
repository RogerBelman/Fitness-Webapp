import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { addSet, addWorkoutExercise, getWorkout } from '../api/workouts'
import type {
  AddWorkoutExerciseRequest,
  SetEntryRequest,
  WorkoutDetail,
} from '../types/workout'

export function useWorkout(workoutId: string | undefined) {
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [addingSetToExerciseId, setAddingSetToExerciseId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const id = parseWorkoutId(workoutId)

  const loadWorkout = useCallback(async () => {
    if (id === null) {
      setWorkout(null)
      setErrorMessage('Workout ID is invalid.')
      setIsLoading(false)
      return
    }

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
  }, [id])

  useEffect(() => {
    void loadWorkout()
  }, [loadWorkout])

  async function addExercise(request: AddWorkoutExerciseRequest): Promise<boolean> {
    if (id === null) {
      setErrorMessage('Workout ID is invalid.')
      return false
    }

    setIsAddingExercise(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const workoutExercise = await addWorkoutExercise(id, request)
      setSuccessMessage(`${workoutExercise.exercise.name} was added to the workout.`)
      await loadWorkout()
      return true
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      return false
    } finally {
      setIsAddingExercise(false)
    }
  }

  async function addSetEntry(
    workoutExerciseId: number,
    request: SetEntryRequest,
  ): Promise<boolean> {
    setAddingSetToExerciseId(workoutExerciseId)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const exerciseName =
        workout?.exercises.find((item) => item.id === workoutExerciseId)?.exercise.name ??
        'Exercise'
      const createdSet = await addSet(workoutExerciseId, request)

      setSuccessMessage(`Set ${createdSet.setNumber} was added to ${exerciseName}.`)
      await loadWorkout()
      return true
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      return false
    } finally {
      setAddingSetToExerciseId(null)
    }
  }

  return {
    workout,
    isLoading,
    isAddingExercise,
    addingSetToExerciseId,
    errorMessage,
    successMessage,
    addExercise,
    addSetEntry,
  }
}

function parseWorkoutId(workoutId: string | undefined) {
  const id = Number(workoutId)
  return workoutId && Number.isInteger(id) && id > 0 ? id : null
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
