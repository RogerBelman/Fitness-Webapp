import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MonthlyWorkoutCalendar } from '../src/components/dashboard/MonthlyWorkoutCalendar'
import type { Workout } from '../src/types/workout'

function workout(id: number, workoutDate: string): Workout {
  return {
    id, workoutDate, title: 'Training', notes: null, totalSets: 0,
    totalVolume: 0, totalCardioMinutes: 0, exerciseNames: [], trainingTypes: [],
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  }
}

const props = {
  selectedDate: '2026-01-15', today: '2026-10-20',
  onSelectDate: vi.fn(), onClose: vi.fn(),
}

describe('monthly workout summary', () => {
  it('counts separate workouts on the same day while counting that day only once', () => {
    render(<MonthlyWorkoutCalendar {...props} workouts={[
      workout(1, '2026-01-01'), workout(2, '2026-01-01'), workout(3, '2026-01-31'),
      workout(4, '2025-12-31'), workout(5, '2026-02-01'),
    ]} />)
    expect(screen.getByRole('status')).toHaveTextContent('3 workouts across 2 days')
  })

  it('updates for month navigation, year boundaries, empty months, and This Month', async () => {
    const user = userEvent.setup()
    render(<MonthlyWorkoutCalendar {...props} workouts={[
      workout(1, '2025-12-31'), workout(2, '2026-10-20'),
    ]} />)
    expect(screen.getByRole('status')).toHaveTextContent('No workouts recorded for this month.')
    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByRole('heading', { name: 'December 2025' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 workout across 1 day')
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByRole('status')).toHaveTextContent('No workouts recorded for this month.')
    await user.click(screen.getByRole('button', { name: 'This Month' }))
    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 workout across 1 day')
  })

  it('refreshes the summary when the workout data changes', () => {
    const { rerender } = render(<MonthlyWorkoutCalendar {...props} workouts={[]} />)
    rerender(<MonthlyWorkoutCalendar {...props} workouts={[workout(1, '2026-01-15')]} />)
    expect(screen.getByRole('status')).toHaveTextContent('1 workout across 1 day')
  })
})
