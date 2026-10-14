import {
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MeasurementPreferencesContext } from './measurementPreferencesContext'
import type { WeightUnit } from '../utils/weightMeasurement'

const STORAGE_KEY = 'workout-tracker-weight-unit'

export function MeasurementPreferencesProvider({
  children,
}: {
  children: ReactNode
}) {
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(readWeightUnit)

  const value = useMemo(
    () => ({
      weightUnit,
      setWeightUnit(unit: WeightUnit) {
        setWeightUnitState(unit)
        window.localStorage.setItem(STORAGE_KEY, unit)
      },
    }),
    [weightUnit],
  )

  return (
    <MeasurementPreferencesContext.Provider value={value}>
      {children}
    </MeasurementPreferencesContext.Provider>
  )
}

function readWeightUnit(): WeightUnit {
  return window.localStorage.getItem(STORAGE_KEY) === 'kg' ? 'kg' : 'lb'
}
