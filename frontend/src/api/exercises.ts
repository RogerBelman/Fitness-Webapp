import { apiRequest } from './client'
import type { Exercise, ExerciseRequest } from '../types/exercise'

type ExerciseFilters = {
  trainingType?: string
  muscleGroup?: string
}

export function listExercises(filters: ExerciseFilters = {}) {
  const searchParams = new URLSearchParams()
  if (filters.trainingType)
    searchParams.set('trainingType', filters.trainingType)

  if (filters.muscleGroup) {
    searchParams.set('muscleGroup', filters.muscleGroup)
  }

  const queryString = searchParams.toString()
  return apiRequest<Exercise[]>(
    `/api/exercises${queryString ? `?${queryString}` : ''}`,
  )
}

export function getExercise(id: number) {
  return apiRequest<Exercise>(`/api/exercises/${id}`)
}

export function createExercise(request: ExerciseRequest) {
  return apiRequest<Exercise>('/api/exercises', {
    method: 'POST',
    body: request,
  })
}

export function updateExercise(id: number, request: ExerciseRequest) {
  return apiRequest<Exercise>(`/api/exercises/${id}`, {
    method: 'PUT',
    body: request,
  })
}

export function deleteExercise(id: number) {
  return apiRequest<void>(`/api/exercises/${id}`, {
    method: 'DELETE',
  })
}
