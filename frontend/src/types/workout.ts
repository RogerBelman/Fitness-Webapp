import type { Exercise } from './exercise'

export type Workout = {
  id: number
  workoutDate: string
  title: string | null
  notes: string | null
  totalSets: number
  totalVolume: number
  totalCardioMinutes: number
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
  sets: SetEntry[]
  cardioEntries: CardioEntry[]
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

export type CardioEntryRequest = {
  durationMinutes: number
  level?: number | null
}

export type CardioEntry = CardioEntryRequest & {
  id: number
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
}

export type SetEntryRequest = {
  setNumber?: number
  reps: number
  weight: number
}

export type UpdateWorkoutExerciseRequest = {
  exerciseOrder?: number
}
