import {
  useMemo,
  type ReactNode,
} from 'react'
import { MeasurementPreferencesContext } from './measurementPreferencesContext'
import { useAuth } from '../hooks/useAuth'
import type { WeightUnit } from '../utils/weightMeasurement'

export function MeasurementPreferencesProvider({
  children,
}: {
  children: ReactNode
}) {
  const { user, updatePreferences } = useAuth()
  const weightUnit = user?.weightUnit ?? 'lb'

  const value = useMemo(
    () => ({
      weightUnit,
      async setWeightUnit(unit: WeightUnit) {
        await updatePreferences({ weightUnit: unit })
      },
    }),
    [updatePreferences, weightUnit],
  )

  return (
    <MeasurementPreferencesContext.Provider value={value}>
      {children}
    </MeasurementPreferencesContext.Provider>
  )
}
