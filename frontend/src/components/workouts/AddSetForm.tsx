import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useMeasurementPreferences } from '../../hooks/useMeasurementPreferences'
import type { SetEntry, SetEntryRequest } from '../../types/workout'
import { toPounds, weightInputValue } from '../../utils/weightMeasurement'

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
  const { weightUnit } = useMeasurementPreferences()
  const [reps, setReps] = useState(
    initialValues ? String(initialValues.reps) : '',
  )
  const [weight, setWeight] = useState(
    initialValues ? weightInputValue(initialValues.weight, weightUnit) : '',
  )
  const [setNumber, setSetNumber] = useState(
    initialValues ? String(initialValues.setNumber) : '',
  )
  const previousUnit = useRef(weightUnit)

  useEffect(() => {
    if (previousUnit.current !== weightUnit && weight) {
      const pounds = toPounds(Number(weight), previousUnit.current)
      setWeight(weightInputValue(pounds, weightUnit))
    }
    previousUnit.current = weightUnit
  }, [weight, weightUnit])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const wasAdded = await onAdd({
      setNumber: initialValues ? Number(setNumber) : undefined,
      reps: Number(reps),
      weight: toPounds(Number(weight), weightUnit),
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
            Weight ({weightUnit})
            <input
              min="0"
              max={weightUnit === 'kg' ? '45359.23' : '99999.99'}
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
