import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { MeasurementPreferencesProvider } from '../src/contexts/MeasurementPreferences'
import { AddSetForm } from '../src/components/workouts/AddSetForm'
import { WorkoutDetails } from '../src/components/workouts/WorkoutDetails'
import { WorkoutList } from '../src/components/workouts/WorkoutList'
import { WorkoutTemplateList } from '../src/components/workouts/WorkoutTemplateList'
import type { Exercise } from '../src/types/exercise'
import type { Workout, WorkoutDetail } from '../src/types/workout'
import type { WorkoutTemplate } from '../src/types/workoutTemplate'

const timestamp = '2026-10-14T00:00:00Z'
const bench = exercise(1, 'Bench Press', 'STRENGTH')

describe('workout history filters', () => {
  it('searches titles and exercises and filters mixed workouts', async () => {
    const user = userEvent.setup()
    renderWithPreferences(
      <WorkoutList
        isLoading={false}
        workouts={[
          workout(1, 'Push Day', ['Bench Press'], ['STRENGTH']),
          workout(2, 'Conditioning', ['Stationary Bike'], ['CARDIO']),
          workout(3, 'Hybrid Day', ['Bench Press', 'Stationary Bike'], [
            'STRENGTH',
            'CARDIO',
          ]),
        ]}
      />,
    )

    const search = screen.getByRole('searchbox', { name: 'Search Workouts' })
    await user.type(search, 'bike')
    expect(
      screen.queryByRole('heading', { name: 'Push Day' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Conditioning' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Hybrid Day' }),
    ).toBeInTheDocument()

    await user.clear(search)
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Training Type' }),
      'MIXED',
    )
    expect(
      screen.getByRole('heading', { name: 'Hybrid Day' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Conditioning' }),
    ).not.toBeInTheDocument()
  })
})

describe('measurement preferences', () => {
  it('shows kilograms and converts entered set weight back to stored pounds', async () => {
    window.localStorage.setItem('workout-tracker-weight-unit', 'kg')
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(true)
    renderWithPreferences(<AddSetForm isSaving={false} onAdd={onAdd} />)

    await user.type(screen.getByRole('spinbutton', { name: 'Reps' }), '5')
    await user.type(
      screen.getByRole('spinbutton', { name: 'Weight (kg)' }),
      '45.36',
    )
    await user.click(screen.getByRole('button', { name: 'Add Set' }))

    expect(onAdd).toHaveBeenCalledWith({
      setNumber: undefined,
      reps: 5,
      weight: 100,
    })
  })
})

describe('focused workout controls', () => {
  it('shows only order controls while exercises are being reordered', () => {
    renderWithPreferences(
      <WorkoutDetails
        workout={workoutDetail()}
        isSaving={false}
        isReordering
        onAddCardio={async () => true}
        onSaveCardio={async () => true}
        onRemoveCardio={async () => true}
        onAddSet={async () => true}
        onSaveExercise={async () => true}
        onRemoveExercise={async () => true}
        onSaveSet={async () => true}
        onRemoveSet={async () => true}
      />,
    )

    expect(
      screen.getAllByRole('button', { name: /Move .* (up|down)/i }),
    ).toHaveLength(4)
    expect(
      screen.queryByRole('button', { name: 'Show Details' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Remove' }),
    ).not.toBeInTheDocument()
  })
})

describe('template workflows', () => {
  it('confirms workout details before starting from a template', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn().mockResolvedValue({ id: 44 })
    renderWithPreferences(
      <WorkoutTemplateList
        templates={[template()]}
        isLoading={false}
        isSaving={false}
        onUpdate={async () => true}
        onDelete={async () => true}
        onStart={onStart}
        exercises={[bench]}
        isLoadingExercises={false}
        onAddExercise={async () => true}
        onMoveExercise={async () => true}
        onRemoveExercise={async () => true}
        editingId={null}
        onEditingIdChange={() => undefined}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Start Workout' }))
    const title = screen.getByRole('textbox', { name: /Workout Title/ })
    const notes = screen.getByRole('textbox', { name: /Workout Notes/ })
    await user.clear(title)
    await user.type(title, 'Evening Strength')
    await user.clear(notes)
    await user.type(notes, 'Keep the pace steady')
    await user.clear(screen.getByLabelText('Workout Date'))
    await user.type(screen.getByLabelText('Workout Date'), '2026-10-13')
    await user.click(screen.getByRole('button', { name: 'Create Workout' }))

    expect(onStart).toHaveBeenCalledWith(8, {
      workoutDate: '2026-10-13',
      title: 'Evening Strength',
      notes: 'Keep the pace steady',
    })
  })
})

function renderWithPreferences(ui: ReactNode) {
  return render(
    <MemoryRouter>
      <MeasurementPreferencesProvider>{ui}</MeasurementPreferencesProvider>
    </MemoryRouter>,
  )
}

function exercise(
  id: number,
  name: string,
  trainingType: Exercise['trainingType'],
): Exercise {
  return {
    id,
    name,
    trainingType,
    muscleGroup: trainingType === 'STRENGTH' ? 'Chest' : null,
    category: 'None',
    instructions: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function workout(
  id: number,
  title: string,
  exerciseNames: string[],
  trainingTypes: Workout['trainingTypes'],
): Workout {
  return {
    id,
    workoutDate: '2026-10-13',
    title,
    notes: null,
    totalSets: trainingTypes.includes('STRENGTH') ? 3 : 0,
    totalVolume: trainingTypes.includes('STRENGTH') ? 3000 : 0,
    totalCardioMinutes: trainingTypes.includes('CARDIO') ? 20 : 0,
    exerciseNames,
    trainingTypes,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function workoutDetail(): WorkoutDetail {
  return {
    id: 20,
    workoutDate: '2026-10-13',
    title: 'Strength Day',
    notes: null,
    totalSets: 0,
    totalVolume: 0,
    totalCardioMinutes: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    exercises: [bench, exercise(3, 'Cable Row', 'STRENGTH')].map(
      (item, index) => ({
        id: index + 10,
        exerciseOrder: index + 1,
        exercise: item,
        sets: [],
        cardioEntries: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    ),
  }
}

function template(): WorkoutTemplate {
  return {
    id: 8,
    name: 'Strength Routine',
    notes: 'Use controlled reps',
    exercises: [{ id: 30, exerciseOrder: 1, exercise: bench }],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
