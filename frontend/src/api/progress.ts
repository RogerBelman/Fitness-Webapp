import { apiRequest } from './client'
import type {
  CardioProgress,
  ExercisePersonalRecord,
  ExerciseProgress,
} from '../types/progress'

export function getExercisePersonalRecord(exerciseId: number) {
  return apiRequest<ExercisePersonalRecord>(
    `/api/progress/exercises/${exerciseId}/personal-record`,
  )
}

export function getExerciseProgress(exerciseId: number) {
  return apiRequest<ExerciseProgress>(
    `/api/progress/exercises/${exerciseId}/history`,
  )
}

export function getCardioProgress(exerciseId: number) {
  return apiRequest<CardioProgress>(
    `/api/progress/exercises/${exerciseId}/cardio-history`,
  )
}
