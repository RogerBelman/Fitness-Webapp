import type { Exercise } from './exercise'

export type WorkoutTemplateExercise = {
  id: number
  exerciseOrder: number
  exercise: Exercise
}

export type WorkoutTemplate = {
  id: number
  name: string
  notes: string | null
  exercises: WorkoutTemplateExercise[]
  createdAt: string
  updatedAt: string
}

export type WorkoutTemplateRequest = {
  name: string
  notes?: string
}

export type StartTemplateWorkoutRequest = {
  workoutDate: string
  title?: string
  notes?: string
}

export type AddTemplateExerciseRequest = {
  exerciseId: number
  exerciseOrder?: number
}
