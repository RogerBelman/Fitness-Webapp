export type TrainingType = 'STRENGTH' | 'CARDIO'

export type Exercise = {
  id: number
  name: string
  muscleGroup: string | null
  trainingType: TrainingType
  category: string
  instructions: string | null
  createdAt: string
  updatedAt: string
}

export type ExerciseRequest = {
  trainingType: TrainingType
  name: string
  muscleGroup: string
  // Preserve legacy category values when editing existing exercises.
  category?: string
  instructions?: string
}
