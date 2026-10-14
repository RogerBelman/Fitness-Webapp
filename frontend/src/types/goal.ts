import type { Exercise } from './exercise'

export type GoalMetric =
  | 'STRENGTH_MAX_WEIGHT'
  | 'STRENGTH_MAX_VOLUME'
  | 'CARDIO_DURATION'
  | 'CARDIO_LEVEL'

export type ExerciseGoal = {
  id: number
  exercise: Exercise
  metric: GoalMetric
  targetValue: number
  currentValue: number
  achieved: boolean
  createdAt: string
  updatedAt: string
}

export type ExerciseGoalRequest = {
  exerciseId: number
  metric: GoalMetric
  targetValue: number
}
