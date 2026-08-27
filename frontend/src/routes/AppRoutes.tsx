import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { Dashboard } from '../pages/Dashboard'
import { ExerciseLibrary } from '../pages/ExerciseLibrary'
import { NewWorkout } from '../pages/NewWorkout'
import { WorkoutDetail } from '../pages/WorkoutDetail'
import { WorkoutHistory } from '../pages/WorkoutHistory'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="exercises" element={<ExerciseLibrary />} />
        <Route path="workouts/new" element={<NewWorkout />} />
        <Route path="workouts" element={<WorkoutHistory />} />
        <Route path="workouts/:workoutId" element={<WorkoutDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
