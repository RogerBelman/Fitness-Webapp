import { useEffect, useState } from 'react'
import { listWorkouts } from '../api/workouts'
import type { Workout } from '../types/workout'

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    let active = true
    async function loadWorkouts() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const data = await listWorkouts()
        if (active) setWorkouts(data)
      } catch (error) {
        if (active)
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Could not load workout history.',
          )
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadWorkouts()
    return () => {
      active = false
    }
  }, [refreshCount])

  return {
    workouts,
    isLoading,
    errorMessage,
    reloadWorkouts: () => setRefreshCount((count) => count + 1),
  }
}
