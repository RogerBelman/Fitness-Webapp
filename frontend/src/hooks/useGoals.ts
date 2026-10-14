import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { createGoal, deleteGoal, listGoals, updateGoal } from '../api/goals'
import type { ExerciseGoalRequest } from '../types/goal'

export function useGoals() {
  const [goals, setGoals] = useState<Awaited<ReturnType<typeof listGoals>>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      setGoals(await listGoals())
    } catch (error) {
      setErrorMessage(readError(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => void reload(), [reload])

  async function mutate(action: () => Promise<unknown>) {
    setIsSaving(true)
    setErrorMessage(null)
    try {
      await action()
      await reload()
      return true
    } catch (error) {
      setErrorMessage(readError(error))
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    goals,
    isLoading,
    isSaving,
    errorMessage,
    addGoal: (request: ExerciseGoalRequest) => mutate(() => createGoal(request)),
    saveGoal: (id: number, request: ExerciseGoalRequest) =>
      mutate(() => updateGoal(id, request)),
    removeGoal: (id: number) => mutate(() => deleteGoal(id)),
  }
}

function readError(error: unknown) {
  if (error instanceof ApiError && isMessage(error.details)) return error.details.message
  return error instanceof Error ? error.message : 'Could not update goals.'
}

function isMessage(value: unknown): value is { message: string } {
  return typeof value === 'object' && value !== null && 'message' in value &&
    typeof value.message === 'string'
}
