export type WeightUnit = 'lb' | 'kg'

const KILOGRAMS_PER_POUND = 0.45359237

export function fromPounds(value: number, unit: WeightUnit) {
  return unit === 'kg' ? value * KILOGRAMS_PER_POUND : value
}

export function toPounds(value: number, unit: WeightUnit) {
  const pounds = unit === 'kg' ? value / KILOGRAMS_PER_POUND : value
  return roundToTwoDecimals(pounds)
}

export function formatWeight(valueInPounds: number, unit: WeightUnit) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(fromPounds(valueInPounds, unit))
}

export function weightInputValue(valueInPounds: number, unit: WeightUnit) {
  return String(roundToTwoDecimals(fromPounds(valueInPounds, unit)))
}

export function isWeightMetric(metric: string) {
  return metric === 'STRENGTH_MAX_WEIGHT' || metric === 'STRENGTH_MAX_VOLUME'
}

function roundToTwoDecimals(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
