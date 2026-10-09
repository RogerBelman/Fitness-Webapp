import { Fragment, useState } from 'react'
import type { CardioEntry, CardioEntryRequest } from '../../types/workout'
import { DeleteButton } from '../DeleteButton'
import { CardioEntryForm } from './CardioEntryForm'

type Props = {
  entries: CardioEntry[]
  exerciseName: string
  isSaving: boolean
  onAdd: (request: CardioEntryRequest) => Promise<boolean>
  onSave: (id: number, request: CardioEntryRequest) => Promise<boolean>
  onDelete: (id: number) => Promise<boolean>
}

export function CardioEntries({
  entries,
  exerciseName,
  isSaving,
  onAdd,
  onSave,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  return (
    <>
      {entries.length === 0 ? (
        <p className="EmptyState">No cardio logged.</p>
      ) : (
        <div className="TableScroll">
          <table className="SetTable">
            <thead>
              <tr>
                <th scope="col">Duration</th>
                <th scope="col">Level</th>
                <th scope="col">Notes</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <Fragment key={entry.id}>
                  <tr>
                    <td>{entry.durationMinutes} min</td>
                    <td>{entry.level ?? '—'}</td>
                    <td className="CardioNotes">{entry.notes || '—'}</td>
                    <td>
                      <div className="RowActions">
                        <button
                          className="Button ButtonSecondary"
                          type="button"
                          disabled={isSaving || editingId === entry.id}
                          aria-label={`Edit cardio entry ${index + 1} of ${exerciseName}`}
                          onClick={() => setEditingId(entry.id)}
                        >
                          Edit
                        </button>
                        <DeleteButton
                          title={`Delete cardio entry ${index + 1} of ${exerciseName}?`}
                          description="This removes the cardio entry and updates your duration totals. This cannot be undone."
                          disabled={isSaving || editingId !== null}
                          onDelete={() => onDelete(entry.id)}
                        />
                      </div>
                    </td>
                  </tr>
                  {editingId === entry.id ? (
                    <tr>
                      <td colSpan={4}>
                        <CardioEntryForm
                          initialValues={entry}
                          isSaving={isSaving}
                          onCancel={() => setEditingId(null)}
                          onSave={async (request) => {
                            const saved = await onSave(entry.id, request)
                            if (saved) setEditingId(null)
                            return saved
                          }}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CardioEntryForm isSaving={isSaving} onSave={onAdd} />
    </>
  )
}
