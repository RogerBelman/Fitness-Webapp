import { useState } from 'react'
import type { FormEvent } from 'react'
import type { SetEntry, SetEntryRequest } from '../../types/workout'

type AddSetFormProps = {
  isSaving: boolean
  onAdd: (request: SetEntryRequest) => Promise<boolean>
  initialValues?: SetEntry
  onCancel?: () => void
}

export function AddSetForm({
  isSaving,
  onAdd,
  initialValues,
  onCancel,
}: AddSetFormProps) {
  const [reps, setReps] = useState(
    initialValues ? String(initialValues.reps) : '',
  )
  const [weight, setWeight] = useState(
    initialValues ? String(initialValues.weight) : '',
  )
  const [setNumber, setSetNumber] = useState(
    initialValues ? String(initialValues.setNumber) : '',
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const wasAdded = await onAdd({
      setNumber: initialValues ? Number(setNumber) : undefined,
      reps: Number(reps),
      weight: Number(weight),
    })

    if (wasAdded && !initialValues) {
      setReps('')
      setWeight('')
    }
  }

  return (
    <form className="SetEntryForm" onSubmit={handleSubmit}>
      <fieldset className="FormFieldset" disabled={isSaving}>
        <div
          className={`SetEntryFields${initialValues ? ' SetEditFields' : ''}`}
        >
          {initialValues ? (
            <label>
              Set Number
              <input
                min="1"
                required
                step="1"
                type="number"
                value={setNumber}
                onChange={(event) => setSetNumber(event.target.value)}
              />
            </label>
          ) : null}
          <label>
            Reps
            <input
              min="1"
              onChange={(event) => setReps(event.target.value)}
              required
              step="1"
              type="number"
              value={reps}
            />
          </label>

          <label>
            Weight (lb)
            <input
              min="0"
              max="99999.99"
              onChange={(event) => setWeight(event.target.value)}
              required
              step="0.01"
              type="number"
              value={weight}
            />
          </label>

          <button
            className="Button ButtonPrimary"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Saving...' : initialValues ? 'Save Set' : 'Add Set'}
          </button>
          {onCancel ? (
            <button
              className="Button ButtonSecondary"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </fieldset>
    </form>
  )
}
