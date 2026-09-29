import { apiRequest } from './client'
import type { ExercisePersonalRecord, ExerciseProgress } from '../types/progress'

export function getExercisePersonalRecord(exerciseId: number) {
  return apiRequest<ExercisePersonalRecord>(
    `/api/progress/exercises/${exerciseId}/personal-record`,
  )
}

export function getExerciseProgress(exerciseId: number) {
  return apiRequest<ExerciseProgress>(`/api/progress/exercises/${exerciseId}/history`)
}
