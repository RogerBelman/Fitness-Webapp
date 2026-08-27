import { apiRequest } from './client'
import type { Exercise, ExerciseRequest } from '../types/exercise'

type ExerciseFilters = {
  muscleGroup?: string
  category?: string
}

export function listExercises(filters: ExerciseFilters = {}) {
  const searchParams = new URLSearchParams()

  if (filters.muscleGroup) {
    searchParams.set('muscleGroup', filters.muscleGroup)
  }

  if (filters.category) {
    searchParams.set('category', filters.category)
  }

  const queryString = searchParams.toString()
  return apiRequest<Exercise[]>(`/api/exercises${queryString ? `?${queryString}` : ''}`)
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
