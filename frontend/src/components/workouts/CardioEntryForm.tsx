import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CardioEntry, CardioEntryRequest } from '../../types/workout'

type Props = {
  isSaving: boolean
  onSave: (request: CardioEntryRequest) => Promise<boolean>
  initialValues?: CardioEntry
  onCancel?: () => void
}

export function CardioEntryForm({
  isSaving,
  onSave,
  initialValues,
  onCancel,
}: Props) {
  const [duration, setDuration] = useState(
    initialValues ? String(initialValues.durationMinutes) : '',
  )
  const [level, setLevel] = useState(
    initialValues?.level != null ? String(initialValues.level) : '',
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = await onSave({
      durationMinutes: Number(duration),
      level: level === '' ? null : Number(level),
    })
    if (saved && !initialValues) {
      setDuration('')
      setLevel('')
    }
  }

  return (
    <form className="SetEntryForm" onSubmit={handleSubmit}>
      <fieldset className="FormFieldset" disabled={isSaving}>
        <div className="FormGrid CardioEntryFields">
          <label>
            Duration (minutes)
            <input
              type="number"
              min="0.01"
              max="99999.99"
              step="0.01"
              required
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
          </label>
          <label>
            <span>Machine Level <span className="OptionalLabel">(optional)</span></span>
            <input
              type="number"
              min="0"
              max="999.99"
              step="0.01"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            />
          </label>
        </div>
        <p className="ExerciseTrackingHint">
          Log one entry for a steady session, or separate entries for intervals.
          Leave level blank when it does not apply.
        </p>
        <div className="FormActions">
          <button className="Button ButtonPrimary" type="submit">
            {isSaving
              ? 'Saving...'
              : initialValues
                ? 'Save Cardio Entry'
                : 'Add Cardio Entry'}
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
