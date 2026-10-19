import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { Dashboard } from '../pages/Dashboard'
import { ExerciseLibrary } from '../pages/ExerciseLibrary'
import { Progress } from '../pages/Progress'
import { WorkoutDetail } from '../pages/WorkoutDetail'
import { Workouts } from '../pages/Workouts'
import { WorkoutTemplates } from '../pages/WorkoutTemplates'
import { Settings } from '../pages/Settings'
import { Login } from '../pages/Login'
import { ForgotPassword } from '../pages/ForgotPassword'
import { ResetPassword } from '../pages/ResetPassword'
import { Landing } from '../pages/Landing'
import { VerifyEmail } from '../pages/VerifyEmail'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Landing />} />
      <Route path="login" element={<Login />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="verify-email" element={<VerifyEmail />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="progress" element={<Progress />} />
          <Route path="exercises" element={<ExerciseLibrary />} />
          <Route path="workouts/new" element={<NewWorkoutRedirect />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="workouts/templates" element={<WorkoutTemplates />} />
          <Route path="workouts/:workoutId" element={<WorkoutDetail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="data" element={<Navigate to="/settings" replace />} />
        </Route>
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
