import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExerciseForm } from '../src/components/exercises/ExerciseForm'
import { ExerciseFilters } from '../src/components/exercises/ExerciseFilters'
import { ExerciseList } from '../src/components/exercises/ExerciseList'
import { ExerciseGuidance } from '../src/components/ExerciseGuidance'
import type { Exercise } from '../src/types/exercise'

const exercise: Exercise = {
  id: 1, name: 'Bench Press', muscleGroup: 'Chest', trainingType: 'STRENGTH',
  category: 'None', instructions: null, createdAt: '', updatedAt: '',
  movementType: 'COMPOUND', repRangeMin: 6, repRangeMax: 10,
}

describe('exercise defaults', () => {
  it('uses the same six muscle groups in the form and filter while keeping focus free text', async () => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(true)
    render(<ExerciseForm isSaving={false} onCreate={save} />)
    render(<ExerciseFilters trainingType="" onTrainingTypeChange={() => undefined} searchTerm=""
      onSearchChange={() => undefined} muscleGroup="" onMuscleGroupChange={() => undefined} />)
    const [group, filter] = screen.getAllByRole('combobox', { name: 'Muscle Group' })
    const choices = (select: HTMLElement) => within(select).getAllByRole('option')
      .filter(option => (option as HTMLOptionElement).value).map(option => option.textContent)
    expect(choices(group)).toEqual(['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'])
    expect(choices(filter)).toEqual(choices(group))
    await user.type(screen.getByRole('textbox', { name: 'Exercise Name' }), 'Calf Raise')
    expect(group).toBeRequired()
    await user.click(screen.getByRole('button', { name: 'Create Exercise' }))
    expect(save).not.toHaveBeenCalled()
    await user.selectOptions(group, 'Legs')
    await user.type(screen.getByRole('textbox', { name: /Muscle Focus/ }), 'Calves')
    await user.click(screen.getByRole('button', { name: 'Create Exercise' }))
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ muscleGroup: 'Legs', muscleFocus: 'Calves' }))
    expect(group).toHaveValue('')
  })


  it('edits and clears a working-set target from the library', async () => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(true)
    render(<ExerciseList exercises={[{ ...exercise, targetWorkingSets: 3 }]} isSaving={false}
      isLoading={false} onSave={save} onDelete={async () => true} />)
    expectDetail('Movement', 'Compound')
    expectDetail('Target Sets', '3')
    expectDetail('Target Reps', '6–10')
    await user.click(screen.getByRole('button', { name: 'Edit Bench Press' }))
    const target = screen.getByRole('spinbutton', { name: 'Target Working Sets' })
    expect(target).toHaveValue(3)
    await user.clear(target)
    await user.type(target, '4')
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).toHaveBeenLastCalledWith(1, expect.objectContaining({ targetWorkingSets: 4 }))
    await user.click(screen.getByRole('button', { name: 'Edit Bench Press' }))
    await user.clear(screen.getByRole('spinbutton', { name: 'Target Working Sets' }))
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).toHaveBeenLastCalledWith(1, expect.objectContaining({ targetWorkingSets: null }))
  })

  it('requires a positive working-set target and displays a one-set target', async () => {
    const user = userEvent.setup()
    const save = vi.fn()
    render(<ExerciseForm isSaving={false} onCreate={save} initialValues={exercise} />)
    const target = screen.getByRole('spinbutton', { name: 'Target Working Sets' })
    await user.type(target, '0')
    expect(target).toBeInvalid()
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).not.toHaveBeenCalled()
    render(<ExerciseGuidance exercise={{ ...exercise, repRangeMin: null, repRangeMax: null, targetWorkingSets: 1 }} />)
    expectDetail('Movement', 'Compound')
    expectDetail('Target Sets', '1')
  })

  it('submits optional strength movement and rep targets' , async () => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(true)
    render(<ExerciseForm isSaving={false} onCreate={save} />)
    await user.type(screen.getByRole('textbox', { name: 'Exercise Name' }), 'Bench Press')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Muscle Group' }), 'Chest')
    await user.type(screen.getByRole('textbox', { name: /Muscle Focus/ }), '  Upper Chest  ')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Movement Type' }), 'COMPOUND')
    await user.type(screen.getByRole('spinbutton', { name: 'Minimum reps' }), '6')
    await user.type(screen.getByRole('spinbutton', { name: 'Maximum reps' }), '10')
    await user.click(screen.getByRole('button', { name: 'Create Exercise' }))
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ movementType: 'COMPOUND',
      repRangeMin: 6, repRangeMax: 10, muscleFocus: 'Upper Chest', durationMinMinutes: null, durationMaxMinutes: null }))
    expect(screen.getByRole('spinbutton', { name: 'Minimum reps' })).toHaveValue(null)
  })

  it('switches to cardio duration inputs and clears hidden strength defaults', async () => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(true)
    render(<ExerciseForm isSaving={false} onCreate={save} />)
    await user.type(screen.getByRole('textbox', { name: 'Exercise Name' }), 'Stationary Bike')
    await user.type(screen.getByRole('textbox', { name: /Muscle Focus/ }), '  Upper Chest  ')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Movement Type' }), 'COMPOUND')
    await user.type(screen.getByRole('spinbutton', { name: 'Target Working Sets' }), '3')
    await user.type(screen.getByRole('spinbutton', { name: 'Minimum reps' }), '6')
    await user.type(screen.getByRole('spinbutton', { name: 'Maximum reps' }), '10')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Muscle Group' }), 'Chest')
    await user.click(screen.getByRole('radio', { name: /Cardio/ }))
    expect(screen.queryByRole('textbox', { name: /Muscle Focus/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Muscle Group' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Movement Type' })).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton', { name: 'Target Working Sets' })).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton', { name: 'Minimum reps' })).not.toBeInTheDocument()
    await user.type(screen.getByRole('spinbutton', { name: 'Minimum minutes' }), '20.5')
    await user.type(screen.getByRole('spinbutton', { name: 'Maximum minutes' }), '30')
    await user.click(screen.getByRole('button', { name: 'Create Exercise' }))
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ trainingType: 'CARDIO', muscleGroup: '',
      movementType: null, repRangeMin: null, repRangeMax: null, targetWorkingSets: null, muscleFocus: null,
      durationMinMinutes: 20.5, durationMaxMinutes: 30 }))
  })

  it.each([
    ['Minimum minutes', 20.5, null],
    ['Maximum minutes', null, 20.5],
  ] as const)('creates cardio with only %s', async (label, durationMinMinutes, durationMaxMinutes) => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(true)
    render(<ExerciseForm isSaving={false} onCreate={save} />)
    await user.click(screen.getByRole('radio', { name: /Cardio/ }))
    await user.type(screen.getByRole('textbox', { name: 'Exercise Name' }), 'Treadmill Walk')
    await user.type(screen.getByRole('spinbutton', { name: label }), '20.5')
    expect(screen.getByRole('spinbutton', { name: 'Minimum minutes' })).not.toBeRequired()
    expect(screen.getByRole('spinbutton', { name: 'Maximum minutes' })).not.toBeRequired()
    await user.click(screen.getByRole('button', { name: 'Create Exercise' }))
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ durationMinMinutes, durationMaxMinutes }))
  })

  it('edits a cardio range into either single target and can clear both', async () => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(false)
    render(<ExerciseForm isSaving={false} onCreate={save} initialValues={{ ...exercise,
      trainingType: 'CARDIO', movementType: null, repRangeMin: null, repRangeMax: null,
      durationMinMinutes: 20, durationMaxMinutes: 30 }} />)
    await user.clear(screen.getByRole('spinbutton', { name: 'Maximum minutes' }))
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ durationMinMinutes: 20, durationMaxMinutes: null }))
    await user.clear(screen.getByRole('spinbutton', { name: 'Minimum minutes' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Maximum minutes' }), '30')
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ durationMinMinutes: null, durationMaxMinutes: 30 }))
    await user.clear(screen.getByRole('spinbutton', { name: 'Maximum minutes' }))
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ durationMinMinutes: null, durationMaxMinutes: null }))
  })

  it.each(['STRENGTH', 'CARDIO'] as const)('keeps %s fixed while allowing other exercise edits', async (trainingType) => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(true)
    const initialValues = trainingType === 'STRENGTH' ? exercise : {
      ...exercise, trainingType, muscleGroup: null, movementType: null,
      repRangeMin: null, repRangeMax: null, durationMinMinutes: 20, durationMaxMinutes: 30,
    }
    render(<ExerciseForm isSaving={false} onCreate={save} initialValues={initialValues} />)
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(screen.getByLabelText(trainingType === 'STRENGTH' ? 'Strength' : 'Cardio')).toBeInTheDocument()
    const name = screen.getByRole('textbox', { name: 'Exercise Name' })
    await user.clear(name)
    await user.type(name, 'Updated Exercise')
    await user.type(screen.getByRole('textbox', { name: /Instructions/ }), 'Keep a steady pace.')
    const target = screen.getByRole('spinbutton', { name: trainingType === 'STRENGTH' ? 'Maximum reps' : 'Maximum minutes' })
    await user.clear(target)
    await user.type(target, '40')
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      trainingType, name: 'Updated Exercise', instructions: 'Keep a steady pace.',
      ...(trainingType === 'STRENGTH' ? { repRangeMax: 40 } : { durationMaxMinutes: 40 }),
    }))
  })

  it('preserves existing defaults when editing from the exercise library', async () => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(true)
    render(<ExerciseList exercises={[exercise]} isSaving={false} isLoading={false}
      onSave={save} onDelete={async () => true} />)
    expectDetail('Movement', 'Compound')
    expectDetail('Target Reps', '6–10')
    await user.click(screen.getByRole('button', { name: 'Edit Bench Press' }))
    expect(screen.getByRole('spinbutton', { name: 'Minimum reps' })).toHaveValue(6)
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).toHaveBeenCalledWith(1, expect.objectContaining({ movementType: 'COMPOUND', repRangeMax: 10 }))
  })

  it('preserves, edits, and clears optional muscle focus from the library', async () => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(true)
    render(<ExerciseList exercises={[{ ...exercise, muscleFocus: 'Upper Chest' }]} isSaving={false}
      isLoading={false} onSave={save} onDelete={async () => true} />)
    expectDetail('Focus', 'Upper Chest')
    expectDetail('Movement', 'Compound')
    expectDetail('Target Reps', '6–10')
    await user.click(screen.getByRole('button', { name: 'Edit Bench Press' }))
    const focus = screen.getByRole('textbox', { name: /Muscle Focus/ })
    expect(focus).toHaveValue('Upper Chest')
    expect(focus).not.toBeRequired()
    expect(focus).toHaveAttribute('maxlength', '80')
    await user.clear(focus)
    await user.type(focus, '  Mid Chest  ')
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).toHaveBeenLastCalledWith(1, expect.objectContaining({ muscleFocus: 'Mid Chest' }))
    await user.click(screen.getByRole('button', { name: 'Edit Bench Press' }))
    await user.clear(screen.getByRole('textbox', { name: /Muscle Focus/ }))
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).toHaveBeenLastCalledWith(1, expect.objectContaining({ muscleFocus: null }))
  })

  it('requires both range bounds and rejects reversed ranges in the form', async () => {
    const user = userEvent.setup()
    const save = vi.fn()
    render(<ExerciseForm isSaving={false} onCreate={save} initialValues={exercise} />)
    const maximum = screen.getByRole('spinbutton', { name: 'Maximum reps' })
    await user.clear(maximum)
    expect(maximum).toBeInvalid()
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).not.toHaveBeenCalled()
    await user.type(maximum, '3')
    expect(maximum).toBeInvalid()
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).not.toHaveBeenCalled()
  })

  it('allows clearing both optional bounds without removing the exercise', async () => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(true)
    render(<ExerciseForm isSaving={false} onCreate={save} initialValues={exercise} />)
    await user.clear(screen.getByRole('spinbutton', { name: 'Minimum reps' }))
    await user.clear(screen.getByRole('spinbutton', { name: 'Maximum reps' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Movement Type' }), '')
    await user.click(screen.getByRole('button', { name: 'Save Exercise' }))
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ movementType: null, repRangeMin: null, repRangeMax: null }))
  })

  it('shows cardio guidance and leaves legacy exercises uncluttered', () => {
    const { rerender, container } = render(<ExerciseGuidance exercise={{ ...exercise, trainingType: 'CARDIO',
      movementType: null, repRangeMin: null, repRangeMax: null, durationMinMinutes: 20, durationMaxMinutes: 30 }} />)
    expectDetail('Target Duration', '20–30 min')
    rerender(<ExerciseGuidance exercise={{ ...exercise, trainingType: 'CARDIO',
      durationMinMinutes: 20, durationMaxMinutes: null }} />)
    expectDetail('Target Duration', 'At least 20 min')
    rerender(<ExerciseGuidance exercise={{ ...exercise, trainingType: 'CARDIO',
      durationMinMinutes: null, durationMaxMinutes: 30 }} />)
    expectDetail('Target Duration', 'Up to 30 min')
    rerender(<ExerciseGuidance exercise={{ ...exercise, movementType: null, repRangeMin: null, repRangeMax: null }} />)
    expect(container).toBeEmptyDOMElement()
  })
})

function expectDetail(label: string, value: string) {
  const term = screen.getByText(label, { selector: 'dt' })
  expect(term.nextElementSibling?.textContent).toBe(value)
}
