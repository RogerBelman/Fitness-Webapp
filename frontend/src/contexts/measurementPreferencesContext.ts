import { createContext } from 'react'
import type { WeightUnit } from '../utils/weightMeasurement'

export type MeasurementPreferencesValue = {
  weightUnit: WeightUnit
  setWeightUnit: (unit: WeightUnit) => Promise<void>
}

export const MeasurementPreferencesContext =
  createContext<MeasurementPreferencesValue | null>(null)
