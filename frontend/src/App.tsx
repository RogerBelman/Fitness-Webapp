import './App.css'
import { MeasurementPreferencesProvider } from './contexts/MeasurementPreferences'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  return (
    <MeasurementPreferencesProvider>
      <AppRoutes />
    </MeasurementPreferencesProvider>
  )
}

export default App
