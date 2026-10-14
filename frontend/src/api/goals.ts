import { apiRequest } from './client'
import type { ExerciseGoal, ExerciseGoalRequest } from '../types/goal'

export function listGoals() {
  return apiRequest<ExerciseGoal[]>('/api/goals')
}

export function createGoal(request: ExerciseGoalRequest) {
  return apiRequest<ExerciseGoal>('/api/goals', { method: 'POST', body: request })
}

export function updateGoal(id: number, request: ExerciseGoalRequest) {
  return apiRequest<ExerciseGoal>(`/api/goals/${id}`, { method: 'PUT', body: request })
}

export function deleteGoal(id: number) {
  return apiRequest<void>(`/api/goals/${id}`, { method: 'DELETE' })
}
