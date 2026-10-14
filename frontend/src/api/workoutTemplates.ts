import { apiRequest } from './client'
import type { WorkoutDetail } from '../types/workout'
import type {
  AddTemplateExerciseRequest,
  StartTemplateWorkoutRequest,
  WorkoutTemplate,
  WorkoutTemplateRequest,
} from '../types/workoutTemplate'

export function listWorkoutTemplates() {
  return apiRequest<WorkoutTemplate[]>('/api/workout-templates')
}

export function createWorkoutTemplate(request: WorkoutTemplateRequest) {
  return apiRequest<WorkoutTemplate>('/api/workout-templates', {
    method: 'POST',
    body: request,
  })
}

export function addTemplateExercise(
  templateId: number,
  request: AddTemplateExerciseRequest,
) {
  return apiRequest<WorkoutTemplate>(
    `/api/workout-templates/${templateId}/exercises`,
    { method: 'POST', body: request },
  )
}

export function updateTemplateExercise(id: number, exerciseOrder: number) {
  return apiRequest<WorkoutTemplate>(`/api/workout-template-exercises/${id}`, {
    method: 'PUT',
    body: { exerciseOrder },
  })
}

export function deleteTemplateExercise(id: number) {
  return apiRequest<void>(`/api/workout-template-exercises/${id}`, {
    method: 'DELETE',
  })
}

export function createTemplateFromWorkout(workoutId: number) {
  return apiRequest<WorkoutTemplate>(`/api/workouts/${workoutId}/template`, {
    method: 'POST',
  })
}

export function updateWorkoutTemplate(
  id: number,
  request: WorkoutTemplateRequest,
) {
  return apiRequest<WorkoutTemplate>(`/api/workout-templates/${id}`, {
    method: 'PUT',
    body: request,
  })
}

export function deleteWorkoutTemplate(id: number) {
  return apiRequest<void>(`/api/workout-templates/${id}`, {
    method: 'DELETE',
  })
}

export function startWorkoutFromTemplate(
  id: number,
  request: StartTemplateWorkoutRequest,
) {
  return apiRequest<WorkoutDetail>(`/api/workout-templates/${id}/workouts`, {
    method: 'POST',
    body: request,
  })
}
