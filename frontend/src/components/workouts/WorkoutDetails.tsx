import { Fragment, useState } from 'react'
import type {
  SetEntry,
  SetEntryRequest,
  UpdateWorkoutExerciseRequest,
  WorkoutDetail,
} from '../../types/workout'
import { DeleteButton } from '../DeleteButton'
import { AddSetForm } from './AddSetForm'
import { EditWorkoutExerciseForm } from './EditWorkoutExerciseForm'

type WorkoutDetailsProps = {
  workout: WorkoutDetail
  isSaving: boolean
  onAddSet: (
    workoutExerciseId: number,
    request: SetEntryRequest,
  ) => Promise<boolean>
  onSaveExercise: (
    id: number,
    request: UpdateWorkoutExerciseRequest,
  ) => Promise<boolean>
  onRemoveExercise: (id: number) => Promise<boolean>
  onSaveSet: (id: number, request: SetEntryRequest) => Promise<boolean>
  onRemoveSet: (id: number) => Promise<boolean>
}

export function WorkoutDetails({
  workout,
  isSaving,
  onAddSet,
  onSaveExercise,
  onRemoveExercise,
  onSaveSet,
  onRemoveSet,
}: WorkoutDetailsProps) {
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(
    null,
  )
  return (
    <>
      <section className="MetricGrid" aria-label="Workout summary">
        <article className="MetricCard">
          <span>Exercises</span>
          <strong>{workout.exercises.length}</strong>
        </article>
        <article className="MetricCard">
          <span>Total Sets</span>
          <strong>{workout.totalSets}</strong>
        </article>
        <article className="MetricCard">
          <span>Total Volume</span>
          <strong>{formatWeight(workout.totalVolume)} lb</strong>
        </article>
      </section>

      {workout.notes ? (
        <section className="ContentBand WorkoutNotes">
          <div className="SectionHeader">
            <h2>Notes</h2>
          </div>
          <p>{workout.notes}</p>
        </section>
      ) : null}

      <section className="ContentBand">
        <div className="SectionHeader">
          <h2>Exercises</h2>
          <span className="RecordCount">{workout.exercises.length}</span>
        </div>

        {workout.exercises.length === 0 ? (
          <p className="EmptyState">
            No exercises have been added to this workout.
          </p>
        ) : (
          <div className="WorkoutExerciseList">
            {workout.exercises.map((workoutExercise) => (
              <article className="WorkoutExerciseRow" key={workoutExercise.id}>
                <div className="WorkoutExerciseHeader">
                  <div>
                    <h3>{workoutExercise.exercise.name}</h3>
                    <p>
                      {workoutExercise.exercise.muscleGroup} /{' '}
                      {workoutExercise.exercise.category}
                    </p>
                  </div>
                  <div className="RowActions">
                    <button
                      className="Button ButtonSecondary"
                      type="button"
                      disabled={
                        isSaving || editingExerciseId === workoutExercise.id
                      }
                      aria-label={`Edit ${workoutExercise.exercise.name} in this workout`}
                      onClick={() => setEditingExerciseId(workoutExercise.id)}
                    >
                      Edit
                    </button>
                    <DeleteButton
                      label="Remove"
                      title={`Remove ${workoutExercise.exercise.name}?`}
                      description="This removes the exercise and all its sets from this workout. The exercise stays in your library. This cannot be undone."
                      disabled={isSaving || editingExerciseId !== null}
                      onDelete={() => onRemoveExercise(workoutExercise.id)}
                    />
                  </div>
                  <span>{workoutExercise.sets.length} sets</span>
                </div>

                {editingExerciseId === workoutExercise.id ? (
                  <EditWorkoutExerciseForm
                    exercise={workoutExercise}
                    isSaving={isSaving}
                    onCancel={() => setEditingExerciseId(null)}
                    onSave={async (request) => {
                      const saved = await onSaveExercise(
                        workoutExercise.id,
                        request,
                      )
                      if (saved) setEditingExerciseId(null)
                      return saved
                    }}
                  />
                ) : null}

                {workoutExercise.notes ? (
                  <p className="WorkoutExerciseNotes">
                    {workoutExercise.notes}
                  </p>
                ) : null}

                {workoutExercise.sets.length === 0 ? (
                  <p className="EmptyState">No sets logged.</p>
                ) : (
                  <SetTable
                    sets={workoutExercise.sets}
                    exerciseName={workoutExercise.exercise.name}
                    isSaving={isSaving}
                    onSave={onSaveSet}
                    onDelete={onRemoveSet}
                  />
                )}

                <AddSetForm
                  isSaving={isSaving}
                  onAdd={(request) => onAddSet(workoutExercise.id, request)}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

type SetTableProps = {
  sets: SetEntry[]
  exerciseName: string
  isSaving: boolean
  onSave: (id: number, request: SetEntryRequest) => Promise<boolean>
  onDelete: (id: number) => Promise<boolean>
}

function SetTable({
  sets,
  exerciseName,
  isSaving,
  onSave,
  onDelete,
}: SetTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  return (
    <div className="TableScroll">
      <table className="SetTable">
        <thead>
          <tr>
            <th scope="col">Set</th>
            <th scope="col">Reps</th>
            <th scope="col">Weight</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sets.map((set) => (
            <Fragment key={set.id}>
              <tr>
                <td>{set.setNumber}</td>
                <td>{set.reps}</td>
                <td>{formatWeight(set.weight)} lb</td>
                <td>
                  <div className="RowActions">
                    <button
                      className="Button ButtonSecondary"
                      type="button"
                      disabled={isSaving || editingId === set.id}
                      aria-label={`Edit set ${set.setNumber} of ${exerciseName}`}
                      onClick={() => setEditingId(set.id)}
                    >
                      Edit
                    </button>
                    <DeleteButton
                      title={`Delete set ${set.setNumber} of ${exerciseName}?`}
                      description="This removes the logged set and updates your totals and progress. This cannot be undone."
                      disabled={isSaving || editingId !== null}
                      onDelete={() => onDelete(set.id)}
                    />
                  </div>
                </td>
              </tr>
              {editingId === set.id ? (
                <tr>
                  <td colSpan={4}>
                    <AddSetForm
                      initialValues={set}
                      isSaving={isSaving}
                      onCancel={() => setEditingId(null)}
                      onAdd={async (request) => {
                        const saved = await onSave(set.id, request)
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
  )
}

function formatWeight(weight: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    weight,
  )
}
