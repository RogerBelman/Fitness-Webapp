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
  const [notes, setNotes] = useState(initialValues?.notes ?? '')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = await onSave({
      durationMinutes: Number(duration),
      level: level === '' ? null : Number(level),
      notes: notes.trim() || null,
    })
    if (saved && !initialValues) {
      setDuration('')
      setLevel('')
      setNotes('')
    }
  }

  return (
    <form className="SetEntryForm" onSubmit={handleSubmit}>
      <fieldset className="FormFieldset" disabled={isSaving}>
        <div className="FormGrid">
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
            Machine Level (optional)
            <input
              type="number"
              min="0"
              max="999.99"
              step="0.01"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            />
          </label>
          <label>
            Session Notes (optional)
            <input
              type="text"
              maxLength={500}
              placeholder="Steady pace, intervals..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>
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
