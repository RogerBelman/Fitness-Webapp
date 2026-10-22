import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { MeasurementPreferencesProvider } from '../src/contexts/MeasurementPreferences'
import { AuthContext } from '../src/contexts/authContext'
import { AddSetForm } from '../src/components/workouts/AddSetForm'
import { AddWorkoutExerciseForm } from '../src/components/workouts/AddWorkoutExerciseForm'
import { ProgressSelector } from '../src/components/progress/ProgressSelector'
import { WorkoutDetails } from '../src/components/workouts/WorkoutDetails'
import { DayWorkouts } from '../src/components/dashboard/DayWorkouts'
import { WorkoutList } from '../src/components/workouts/WorkoutList'
import { WorkoutTemplateList } from '../src/components/workouts/WorkoutTemplateList'
import { Settings } from '../src/pages/Settings'
import { GoalPanel } from '../src/components/progress/GoalPanel'
import type { Exercise } from '../src/types/exercise'
import type { Workout, WorkoutDetail } from '../src/types/workout'
import type { WorkoutTemplate } from '../src/types/workoutTemplate'
import type { ExerciseGoal } from '../src/types/goal'

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
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(true)
    renderWithPreferences(<AddSetForm isSaving={false} onAdd={onAdd} />, 'kg')

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

  it('saves a weight-unit change to the account', async () => {
    const user = userEvent.setup()
    const updatePreferences = vi.fn().mockResolvedValue(undefined)
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: { id: 1, username: 'test_user', email: 'test@example.com', weightUnit: 'lb', createdAt: timestamp },
            isLoading: false,
            login: async () => undefined,
            register: async () => undefined,
            logout: async () => undefined,
            updatePreferences,
            changeEmail: async () => undefined,
            changePassword: async () => undefined,
            deleteAccount: async () => undefined,
          }}
        >
          <MeasurementPreferencesProvider>
            <Routes>
              <Route index element={<Settings />} />
            </Routes>
          </MeasurementPreferencesProvider>
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    const kilograms = screen.getByRole('button', { name: 'kg' })
    expect(kilograms).toHaveAttribute('aria-pressed', 'false')
    await user.click(kilograms)

    expect(updatePreferences).toHaveBeenCalledWith({ weightUnit: 'kg' })
  })
})

describe('goal workflows', () => {
  it('creates a goal and edits an existing target', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(true)
    const onUpdate = vi.fn().mockResolvedValue(true)
    const goal: ExerciseGoal = {
      id: 12,
      exercise: bench,
      metric: 'STRENGTH_MAX_WEIGHT',
      targetValue: 200,
      currentValue: 175,
      achieved: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    renderWithPreferences(
      <GoalPanel
        exercises={[bench]}
        goals={[goal]}
        isLoading={false}
        isSaving={false}
        errorMessage={null}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={async () => true}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add Goal' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Exercise' }), '1')
    await user.type(screen.getByRole('spinbutton', { name: 'Target (lb)' }), '225')
    await user.click(screen.getByRole('button', { name: 'Save Goal' }))
    expect(onCreate).toHaveBeenCalledWith({
      exerciseId: 1,
      metric: 'STRENGTH_MAX_WEIGHT',
      targetValue: 225,
    })

    await user.click(screen.getByRole('button', { name: 'Edit Target' }))
    const editTarget = screen.getByRole('spinbutton', { name: 'New target (lb)' })
    await user.clear(editTarget)
    await user.type(editTarget, '240')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onUpdate).toHaveBeenCalledWith(12, {
      exerciseId: 1,
      metric: 'STRENGTH_MAX_WEIGHT',
      targetValue: 240,
    })
  })
})

describe('consistent exercise pickers', () => {
  const choices = [exercise(4, 'Zulu Cardio', 'CARDIO'), exercise(2, 'Zulu Press', 'STRENGTH'),
    exercise(3, 'Alpha Cardio', 'CARDIO'), exercise(1, 'Alpha Press', 'STRENGTH')]

  function picker(kind: string, items: Exercise[], onSelect: ReturnType<typeof vi.fn>) {
    if (kind === 'workout') return <AddWorkoutExerciseForm exercises={items} isLoadingExercises={false}
      isSaving={false} onAdd={onSelect} onCreateNew={() => undefined} isCreatingExercise={false} />
    if (kind === 'progress') return <ProgressSelector exercises={items} isLoading={false}
      selectedExerciseId={null} onChange={onSelect} />
    if (kind === 'goal') return <GoalPanel exercises={items} goals={[]} isLoading={false} isSaving={false}
      errorMessage={null} onCreate={onSelect} onUpdate={async () => true} onDelete={async () => true} />
    return <WorkoutTemplateList templates={[template()]} isLoading={false} isSaving={false}
      onUpdate={async () => true} onDelete={async () => true} onStart={async () => null}
      exercises={items} isLoadingExercises={false} onAddExercise={onSelect}
      onMoveExercise={async () => true} onRemoveExercise={async () => true}
      editingId={8} onEditingIdChange={() => undefined} />
  }

  it.each(['workout', 'template', 'progress', 'goal'])('sorts and labels %s choices consistently', async (kind) => {
    const user = userEvent.setup()
    const onSelect = vi.fn().mockResolvedValue(true)
    renderWithPreferences(picker(kind, choices, onSelect))
    if (kind === 'goal') await user.click(screen.getByRole('button', { name: 'Add Goal' }))
    const select = screen.getByRole('combobox', { name: /^(Saved Exercise|Exercise)$/ })
    const options = within(select).getAllByRole('option').filter(option => (option as HTMLOptionElement).value)
    expect(options.map(option => option.textContent)).toEqual([
      '💪 Strength — Alpha Press (Chest)', '💪 Strength — Zulu Press (Chest)',
      '❤️ Cardio — Alpha Cardio', '❤️ Cardio — Zulu Cardio',
    ])
    expect(choices.map(item => item.id)).toEqual([4, 2, 3, 1])
    await user.selectOptions(select, '4')
    if (kind === 'workout') {
      await user.click(screen.getByRole('button', { name: 'Add to Workout' }))
      expect(onSelect).toHaveBeenCalledWith({ exerciseId: 4 })
    } else if (kind === 'template') {
      await user.click(screen.getByRole('button', { name: 'Add Exercise' }))
      expect(onSelect).toHaveBeenCalledWith(8, 4)
    } else if (kind === 'progress') expect(onSelect).toHaveBeenCalledWith(4)
    else expect(screen.getByRole('combobox', { name: 'Measurement' })).toHaveValue('CARDIO_DURATION')
  })

  it.each(['workout', 'template'])('uses the same empty library state in %s', (kind) => {
    renderWithPreferences(picker(kind, [], vi.fn()))
    expect(screen.getByRole('combobox', { name: 'Saved Exercise' })).toBeDisabled()
    expect(screen.getByRole('option', { name: 'No saved exercises yet' })).toBeInTheDocument()
  })
})

describe('dashboard exercise focus', () => {
  it('shows saved strength focus while keeping targets and instructions out of the preview', () => {
    const detail = workoutDetail()
    detail.exercises[0].exercise = { ...bench, muscleFocus: 'Upper Chest', targetWorkingSets: 3,
      repRangeMin: 6, repRangeMax: 10, instructions: 'Keep your shoulders down.' }
    detail.exercises[1].exercise = { ...exercise(3, 'Bike', 'CARDIO'), muscleFocus: 'Legacy cardio focus' }
    const summary: Workout = { ...detail, exerciseNames: ['Bench Press', 'Bike'], trainingTypes: ['STRENGTH', 'CARDIO'] }
    renderWithPreferences(<DayWorkouts date={detail.workoutDate} today="2026-10-20" workouts={[summary]}
      details={[detail]} isLoading={false} isLoadingDetails={false} errorMessage={null} />)
    expect(screen.getByText('Focus: Upper Chest')).toBeInTheDocument()
    expect(screen.queryByText(/Legacy cardio focus/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Target (Sets|Reps|Duration)$/)).not.toBeInTheDocument()
    expect(screen.queryByText('Keep your shoulders down.')).not.toBeInTheDocument()
  })
})

describe('focused workout controls', () => {
  it('shows saved targets on collapsed workout exercises without duplicating expanded details', async () => {
    const user = userEvent.setup()
    const detail = workoutDetail()
    detail.exercises[0].exercise = { ...bench, targetWorkingSets: 3, repRangeMin: 6, repRangeMax: 10 }
    const targets = [
      { durationMinMinutes: 20, durationMaxMinutes: null, text: 'At least 20 min' },
      { durationMinMinutes: null, durationMaxMinutes: 30, text: 'Up to 30 min' },
      { durationMinMinutes: 15, durationMaxMinutes: 25, text: '15–25 min' },
    ]
    detail.exercises.push(...targets.map((target, index) => ({
      ...detail.exercises[1], id: 100 + index, exerciseOrder: 3 + index,
      exercise: { ...exercise(50 + index, `Cardio ${index}`, 'CARDIO'),
        durationMinMinutes: target.durationMinMinutes, durationMaxMinutes: target.durationMaxMinutes },
    })))
    renderWithPreferences(<WorkoutDetails workout={detail} isSaving={false} isReordering={false}
      onAddCardio={async () => true} onSaveCardio={async () => true} onRemoveCardio={async () => true}
      onAddSet={async () => true} onSaveExercise={async () => true} onRemoveExercise={async () => true}
      onSaveSet={async () => true} onRemoveSet={async () => true} />)
    const expected = ['6–10', ...targets.map(target => target.text)]
    expect(screen.getByText('Target Sets').nextElementSibling?.textContent).toBe('3')
    for (const text of expected) expect(screen.getAllByText(text)).toHaveLength(1)
    const emptyCard = screen.getByRole('heading', { name: 'Cable Row' }).closest('article')!
    expect(within(emptyCard).queryByText(/^Target (Sets|Reps|Duration)$/)).not.toBeInTheDocument()
    for (const button of screen.getAllByRole('button', { name: 'Show Details' })) await user.click(button)
    for (const text of expected) expect(screen.getAllByText(text)).toHaveLength(1)
    for (const button of screen.getAllByRole('button', { name: 'Hide Details' })) await user.click(button)
    for (const text of expected) expect(screen.getAllByText(text)).toHaveLength(1)
  })


  it('shows only order controls while exercises are being reordered', () => {
    const detail = workoutDetail()
    detail.exercises[0].exercise = { ...bench, targetWorkingSets: 3, repRangeMin: 6, repRangeMax: 10 }
    renderWithPreferences(
      <WorkoutDetails
        workout={detail}
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

    expect(screen.queryByText(/^Target (Sets|Reps|Duration)$/)).not.toBeInTheDocument()
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

  it('keeps detail edits explicit while exercise changes save immediately', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(true)
    const onAddExercise = vi.fn().mockResolvedValue(true)
    const cableRow = exercise(2, 'Cable Row', 'STRENGTH')

    renderWithPreferences(
      <WorkoutTemplateList
        templates={[template()]}
        isLoading={false}
        isSaving={false}
        onUpdate={onUpdate}
        onDelete={async () => true}
        onStart={async () => null}
        exercises={[bench, cableRow]}
        isLoadingExercises={false}
        onAddExercise={onAddExercise}
        onMoveExercise={async () => true}
        onRemoveExercise={async () => true}
        editingId={8}
        onEditingIdChange={() => undefined}
      />,
    )

    const name = screen.getByRole('textbox', { name: 'Template Name' })
    await user.clear(name)
    await user.type(name, 'Updated Routine')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Saved Exercise' }), '2')
    await user.click(screen.getByRole('button', { name: 'Add Exercise' }))

    expect(onAddExercise).toHaveBeenCalledWith(8, 2)
    expect(onUpdate).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Save Details' }))
    expect(onUpdate).toHaveBeenCalledWith(8, {
      name: 'Updated Routine',
      notes: 'Use controlled reps',
    })
  })
})

function renderWithPreferences(ui: ReactNode, weightUnit: 'lb' | 'kg' = 'lb') {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user: { id: 1, username: 'test_user', email: 'test@example.com', weightUnit, createdAt: timestamp },
          isLoading: false,
          login: async () => undefined,
          register: async () => undefined,
          logout: async () => undefined,
          updatePreferences: async () => undefined,
          changeEmail: async () => undefined,
          changePassword: async () => undefined,
          deleteAccount: async () => undefined,
        }}
      >
        <MeasurementPreferencesProvider>{ui}</MeasurementPreferencesProvider>
      </AuthContext.Provider>
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
