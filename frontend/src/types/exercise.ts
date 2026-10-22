export type TrainingType = 'STRENGTH' | 'CARDIO'

export type MovementType = 'COMPOUND' | 'ISOLATION'

export type ExerciseDefaults = {
  movementType?: MovementType | null
  targetWorkingSets?: number | null
  repRangeMin?: number | null
  repRangeMax?: number | null
  durationMinMinutes?: number | null
  durationMaxMinutes?: number | null
}

export type Exercise = ExerciseDefaults & {
  id: number
  name: string
  muscleGroup: string | null
  muscleFocus?: string | null
  trainingType: TrainingType
  category: string
  instructions: string | null
  createdAt: string
  updatedAt: string
}

export type ExerciseRequest = ExerciseDefaults & {
  trainingType: TrainingType
  name: string
  muscleGroup: string
  muscleFocus?: string | null
  // Preserve legacy category values when editing existing exercises.
  category?: string
  instructions?: string
}
