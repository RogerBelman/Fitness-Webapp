import type { GoalMetric } from './goal'
import type { ExerciseDefaults, TrainingType } from './exercise'

export type DataBackup = {
  version: number
  exportedAt: string
  exercises: Array<ExerciseDefaults & {
    name: string
    muscleGroup: string | null
    muscleFocus?: string | null
    category: string
    instructions: string | null
    trainingType: TrainingType
  }>
  workouts: Array<{
    workoutDate: string
    title: string | null
    notes: string | null
    exercises: Array<{
      exerciseName: string
      exerciseOrder: number
      sets: Array<{ setNumber: number; reps: number; weight: number }>
      cardioEntries: Array<{ durationMinutes: number; level: number | null }>
    }>
  }>
  templates: Array<{
    name: string
    notes: string | null
    exercises: Array<{ exerciseName: string; exerciseOrder: number }>
  }>
  goals: Array<{
    exerciseName: string
    metric: GoalMetric
    targetValue: number
  }>
}

export type DataImportResponse = {
  exercises: number
  workouts: number
  templates: number
  goals: number
}
