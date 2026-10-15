import './App.css'
import { AuthProvider } from './contexts/AuthProvider'
import { MeasurementPreferencesProvider } from './contexts/MeasurementPreferences'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <MeasurementPreferencesProvider>
        <AppRoutes />
      </MeasurementPreferencesProvider>
    </AuthProvider>
  )
}

export default App
