import { useContext } from 'react'
import { MeasurementPreferencesContext } from '../contexts/measurementPreferencesContext'

export function useMeasurementPreferences() {
  const value = useContext(MeasurementPreferencesContext)
  if (!value) {
    throw new Error(
      'useMeasurementPreferences must be used inside MeasurementPreferencesProvider.',
    )
  }
  return value
}
