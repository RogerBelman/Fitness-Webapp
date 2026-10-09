import { useEffect, useState } from 'react'
import { getWorkout } from '../api/workouts'
import type { Workout, WorkoutDetail } from '../types/workout'

type DayState = {
  date: string
  details: WorkoutDetail[]
  isLoading: boolean
  errorMessage: string | null
}

export function useDayWorkouts(
  date: string,
  workouts: Workout[],
  isReady: boolean,
) {
  const [state, setState] = useState<DayState>({
    date,
    details: [],
    isLoading: false,
    errorMessage: null,
  })

  useEffect(() => {
    let active = true
    const selectedWorkouts = workouts.filter(
      (workout) => workout.workoutDate === date,
    )
    if (!isReady || selectedWorkouts.length === 0) {
      setState({ date, details: [], isLoading: false, errorMessage: null })
      return
    }
    setState({ date, details: [], isLoading: true, errorMessage: null })
    Promise.all(selectedWorkouts.map((workout) => getWorkout(workout.id)))
      .then((details) => {
        if (active)
          setState({ date, details, isLoading: false, errorMessage: null })
      })
      .catch(() => {
        if (active)
          setState({
            date,
            details: [],
            isLoading: false,
            errorMessage:
              'Could not load exercise details for this day. Open a workout to try again.',
          })
      })
    return () => {
      active = false
    }
  }, [date, workouts, isReady])

  return state.date === date
    ? state
    : { date, details: [], isLoading: true, errorMessage: null }
}
