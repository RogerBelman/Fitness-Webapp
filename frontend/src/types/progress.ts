export type PersonalRecord = {
  weight: number
  reps: number
  workoutDate: string
  workoutId: number
}

export type ExercisePersonalRecord = {
  exerciseId: number
  exerciseName: string
  personalRecord: PersonalRecord | null
}

export type ExerciseProgressPoint = {
  workoutId: number
  workoutDate: string
  totalSets: number
  maxWeight: number
  totalVolume: number
}

export type ExerciseProgress = {
  exerciseId: number
  exerciseName: string
  history: ExerciseProgressPoint[]
}

export type CardioProgressPoint = {
  workoutId: number
  workoutDate: string
  totalEntries: number
  totalDurationMinutes: number
  maxLevel: number | null
}

export type CardioProgress = {
  exerciseId: number
  exerciseName: string
  history: CardioProgressPoint[]
}
