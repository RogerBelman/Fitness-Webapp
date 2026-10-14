import type { Workout } from '../types/workout'

export type WorkoutTrainingFilter = 'ALL' | 'STRENGTH' | 'CARDIO' | 'MIXED'

export type WorkoutFilters = {
  search: string
  trainingType: WorkoutTrainingFilter
  fromDate: string
  toDate: string
}

export function filterWorkouts(workouts: Workout[], filters: WorkoutFilters) {
  const query = filters.search.trim().toLocaleLowerCase()

  return workouts.filter((workout) => {
    const matchesSearch =
      !query ||
      workout.title?.toLocaleLowerCase().includes(query) === true ||
      workout.exerciseNames.some((name) =>
        name.toLocaleLowerCase().includes(query),
      )

    return (
      matchesSearch &&
      matchesTrainingType(workout, filters.trainingType) &&
      (!filters.fromDate || workout.workoutDate >= filters.fromDate) &&
      (!filters.toDate || workout.workoutDate <= filters.toDate)
    )
  })
}

export function workoutTrainingType(
  workout: Pick<Workout, 'trainingTypes'>,
): Exclude<WorkoutTrainingFilter, 'ALL'> | 'EMPTY' {
  const hasStrength = workout.trainingTypes.includes('STRENGTH')
  const hasCardio = workout.trainingTypes.includes('CARDIO')
  if (hasStrength && hasCardio) return 'MIXED'
  if (hasStrength) return 'STRENGTH'
  if (hasCardio) return 'CARDIO'
  return 'EMPTY'
}

function matchesTrainingType(
  workout: Workout,
  filter: WorkoutTrainingFilter,
) {
  return filter === 'ALL' || workoutTrainingType(workout) === filter
}
