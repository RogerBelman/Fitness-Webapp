import { describe, expect, it } from 'vitest'
import {
  formatWeight,
  fromPounds,
  toPounds,
} from '../src/utils/weightMeasurement'

describe('weight measurement conversion', () => {
  it('converts pounds and kilograms at the display boundary', () => {
    expect(fromPounds(100, 'kg')).toBeCloseTo(45.359237)
    expect(toPounds(45.36, 'kg')).toBe(100)
    expect(formatWeight(225, 'kg')).toBe('102.06')
    expect(formatWeight(225, 'lb')).toBe('225')
  })
})
