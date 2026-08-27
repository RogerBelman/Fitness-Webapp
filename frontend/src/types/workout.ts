import type { Exercise } from './exercise'

export type Workout = {
  id: number
  workoutDate: string
  title: string | null
  notes: string | null
  totalSets: number
  totalVolume: number
  createdAt: string
  updatedAt: string
}

export type WorkoutDetail = Workout & {
  exercises: WorkoutExercise[]
}

export type WorkoutExercise = {
  id: number
  exerciseOrder: number
  exercise: Exercise
  notes: string | null
  sets: SetEntry[]
  createdAt: string
  updatedAt: string
}

export type SetEntry = {
  id: number
  setNumber: number
  reps: number
  weight: number
  createdAt: string
  updatedAt: string
}

export type WorkoutRequest = {
  workoutDate?: string
  title?: string
  notes?: string
}

export type AddWorkoutExerciseRequest = {
  exerciseId: number
  exerciseOrder?: number
  notes?: string
}

export type SetEntryRequest = {
  setNumber?: number
  reps: number
  weight: number
}
