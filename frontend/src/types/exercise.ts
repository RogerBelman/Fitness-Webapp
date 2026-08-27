export type Exercise = {
  id: number
  name: string
  muscleGroup: string
  category: string
  createdAt: string
  updatedAt: string
}

export type ExerciseRequest = {
  name: string
  muscleGroup: string
  category: string
}
