import { useState } from 'react'
import type { Exercise, ExerciseRequest } from '../../types/exercise'
import { DeleteButton } from '../DeleteButton'
import { ExerciseMetadata } from '../ExerciseMetadata'
import { ExerciseGuidance } from '../ExerciseGuidance'
import { ExerciseForm } from './ExerciseForm'

type ExerciseListProps = {
  exercises: Exercise[]
  isLoading: boolean
  isSaving: boolean
  onSave: (id: number, request: ExerciseRequest) => Promise<boolean>
  onDelete: (id: number) => Promise<boolean>
}

export function ExerciseList({
  exercises,
  isLoading,
  isSaving,
  onSave,
  onDelete,
}: ExerciseListProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  return (
    <section className="ContentBand">
      <div className="SectionHeader">
        <h2>Exercises</h2>
        <span className="RecordCount">{exercises.length}</span>
      </div>

      {isLoading ? <p className="EmptyState">Loading exercises...</p> : null}

      {!isLoading && exercises.length === 0 ? (
        <p className="EmptyState">No exercises found.</p>
      ) : null}

      {!isLoading && exercises.length > 0 ? (
        <div className="ExerciseList">
          {exercises.map((exercise) => (
            <div className="ExerciseLibraryItem" key={exercise.id}>
              <article className="ExerciseCard">
                <div>
                  <h3>{exercise.name}</h3>
                  <ExerciseMetadata exercise={exercise} />
                  <ExerciseGuidance exercise={exercise} />
                </div>
                <div className="RowActions">
                  <button
                    className="Button ButtonSecondary"
                    type="button"
                    disabled={isSaving || editingId === exercise.id}
                    aria-label={`Edit ${exercise.name}`}
                    onClick={() => setEditingId(exercise.id)}
                  >
                    Edit
                  </button>
                  <DeleteButton
                    title={`Delete ${exercise.name}?`}
                    description="This removes the exercise from the library. Exercises used in workout history must first be removed from those workouts. This cannot be undone."
                    disabled={isSaving || editingId !== null}
                    onDelete={() => onDelete(exercise.id)}
                  />
                </div>
                {exercise.instructions ? (
                  <div className="ExerciseInstructions">
                    <strong>Instructions</strong>
                    <p>{exercise.instructions}</p>
                  </div>
                ) : null}
              </article>
              {editingId === exercise.id ? (
                <ExerciseForm
                  key={exercise.id}
                  initialValues={{
                    name: exercise.name,
                    muscleGroup: exercise.muscleGroup ?? '',
                    muscleFocus: exercise.muscleFocus,
                    trainingType: exercise.trainingType,
                    category: exercise.category,
                    instructions: exercise.instructions ?? '',
                    movementType: exercise.movementType,
                    targetWorkingSets: exercise.targetWorkingSets,
                    repRangeMin: exercise.repRangeMin,
                    repRangeMax: exercise.repRangeMax,
                    durationMinMinutes: exercise.durationMinMinutes,
                    durationMaxMinutes: exercise.durationMaxMinutes,
                  }}
                  isSaving={isSaving}
                  onCancel={() => setEditingId(null)}
                  onCreate={async (request) => {
                    const saved = await onSave(exercise.id, request)
                    if (saved) setEditingId(null)
                    return saved
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
