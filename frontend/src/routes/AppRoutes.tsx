import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { Dashboard } from '../pages/Dashboard'
import { ExerciseLibrary } from '../pages/ExerciseLibrary'
import { Progress } from '../pages/Progress'
import { WorkoutDetail } from '../pages/WorkoutDetail'
import { Workouts } from '../pages/Workouts'
import { WorkoutTemplates } from '../pages/WorkoutTemplates'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="progress" element={<Progress />} />
        <Route path="exercises" element={<ExerciseLibrary />} />
        <Route path="workouts/new" element={<NewWorkoutRedirect />} />
        <Route path="workouts" element={<Workouts />} />
        <Route path="workouts/templates" element={<WorkoutTemplates />} />
        <Route path="workouts/:workoutId" element={<WorkoutDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function NewWorkoutRedirect() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  params.set('new', '1')
  return <Navigate to={`/workouts?${params.toString()}`} replace />
}
