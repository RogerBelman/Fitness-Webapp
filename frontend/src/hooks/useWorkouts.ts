import { useEffect, useState } from 'react'
import { listWorkouts } from '../api/workouts'
import type { Workout } from '../types/workout'

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadWorkouts() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const data = await listWorkouts()
        setWorkouts(data)
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Could not load workout history.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadWorkouts()
  }, [])

  return { workouts, isLoading, errorMessage }
}
