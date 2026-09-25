import { useState } from 'react'
import type { FormEvent } from 'react'
import type { SetEntryRequest } from '../../types/workout'

type AddSetFormProps = {
  isSaving: boolean
  onAdd: (request: SetEntryRequest) => Promise<boolean>
}

export function AddSetForm({ isSaving, onAdd }: AddSetFormProps) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const wasAdded = await onAdd({
      reps: Number(reps),
      weight: Number(weight),
    })

    if (wasAdded) {
      setReps('')
      setWeight('')
    }
  }

  return (
    <form className="SetEntryForm" onSubmit={handleSubmit}>
      <div className="SetEntryFields">
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
            onChange={(event) => setWeight(event.target.value)}
            required
            step="0.01"
            type="number"
            value={weight}
          />
        </label>

        <button className="Button ButtonPrimary" disabled={isSaving} type="submit">
          {isSaving ? 'Adding...' : 'Add Set'}
        </button>
      </div>
    </form>
  )
}
