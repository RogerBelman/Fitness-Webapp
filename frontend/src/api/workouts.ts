import { apiRequest } from './client'
import type {
  AddWorkoutExerciseRequest,
  SetEntry,
  SetEntryRequest,
  Workout,
  WorkoutDetail,
  WorkoutExercise,
  WorkoutRequest,
  UpdateWorkoutExerciseRequest,
} from '../types/workout'

export function listWorkouts() {
  return apiRequest<Workout[]>('/api/workouts')
}

export function getWorkout(id: number) {
  return apiRequest<WorkoutDetail>(`/api/workouts/${id}`)
}

export function createWorkout(request: WorkoutRequest) {
  return apiRequest<Workout>('/api/workouts', {
    method: 'POST',
    body: request,
  })
}

export function addWorkoutExercise(
  workoutId: number,
  request: AddWorkoutExerciseRequest,
) {
  return apiRequest<WorkoutExercise>(`/api/workouts/${workoutId}/exercises`, {
    method: 'POST',
    body: request,
  })
}

export function addSet(workoutExerciseId: number, request: SetEntryRequest) {
  return apiRequest<SetEntry>(
    `/api/workout-exercises/${workoutExerciseId}/sets`,
    {
      method: 'POST',
      body: request,
    },
  )
}

export function updateWorkout(id: number, request: WorkoutRequest) {
  return apiRequest<Workout>(`/api/workouts/${id}`, {
    method: 'PUT',
    body: request,
  })
}

export function deleteWorkout(id: number) {
  return apiRequest<void>(`/api/workouts/${id}`, { method: 'DELETE' })
}

export function updateWorkoutExercise(
  id: number,
  request: UpdateWorkoutExerciseRequest,
) {
  return apiRequest<WorkoutExercise>(`/api/workout-exercises/${id}`, {
    method: 'PUT',
    body: request,
  })
}

export function deleteWorkoutExercise(id: number) {
  return apiRequest<void>(`/api/workout-exercises/${id}`, { method: 'DELETE' })
}

export function updateSet(id: number, request: SetEntryRequest) {
  return apiRequest<SetEntry>(`/api/sets/${id}`, {
    method: 'PUT',
    body: request,
  })
}

export function deleteSet(id: number) {
  return apiRequest<void>(`/api/sets/${id}`, { method: 'DELETE' })
}
