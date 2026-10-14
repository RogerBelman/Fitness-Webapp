import { useId, useState, type FormEvent } from 'react'
import type { WorkoutTemplateRequest } from '../../types/workoutTemplate'

type WorkoutTemplateFormProps = {
  isSaving: boolean
  onCancel: () => void
  onCreate: (request: WorkoutTemplateRequest) => Promise<boolean>
}

export function WorkoutTemplateForm({
  isSaving,
  onCancel,
  onCreate,
}: WorkoutTemplateFormProps) {
  const formId = useId()
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onCreate({ name, notes: notes || undefined })
  }

  return (
    <form
      className="FormSurface EditorPanel TemplateCreatePanel"
      onSubmit={submit}
      aria-labelledby={`${formId}-title`}
    >
      <fieldset className="FormFieldset" disabled={isSaving}>
        <header className="EditorPanelHeader">
          <h2 id={`${formId}-title`}>New Template</h2>
          <p>
            Create the reusable details first. You can add and arrange
            exercises next.
          </p>
        </header>

        <label>
          Template Name
          <input
            autoFocus
            maxLength={120}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Upper Body"
          />
        </label>

        <label>
          <span>
            Template Notes <span className="OptionalLabel">(optional)</span>
          </span>
          <textarea
            maxLength={500}
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Routine focus or reminders"
          />
        </label>

        <div className="FormActions EditorPanelActions">
          <button
            className="Button ButtonSecondary"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button className="Button ButtonPrimary" type="submit">
            {isSaving ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
