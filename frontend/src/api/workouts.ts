import { apiRequest } from './client'
import type {
  AddWorkoutExerciseRequest,
  SetEntry,
  SetEntryRequest,
  Workout,
  WorkoutDetail,
  WorkoutExercise,
  WorkoutRequest,
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
  return apiRequest<SetEntry>(`/api/workout-exercises/${workoutExerciseId}/sets`, {
    method: 'POST',
    body: request,
  })
}
