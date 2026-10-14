import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
import { useMeasurementPreferences } from '../../hooks/useMeasurementPreferences'
import type {
  SetEntry,
  CardioEntryRequest,
  SetEntryRequest,
  UpdateWorkoutExerciseRequest,
  WorkoutDetail,
} from '../../types/workout'
import { DeleteButton } from '../DeleteButton'
import { TrainingTypeBadge } from '../TrainingTypeBadge'
import { AddSetForm } from './AddSetForm'
import { CardioEntries } from './CardioEntries'
import { formatWeight } from '../../utils/weightMeasurement'

type WorkoutDetailsProps = {
  onAddCardio: (id: number, request: CardioEntryRequest) => Promise<boolean>
  onSaveCardio: (id: number, request: CardioEntryRequest) => Promise<boolean>
  onRemoveCardio: (id: number) => Promise<boolean>
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
  isReordering: boolean
  exerciseActions?: ReactNode
  addExercisePanel?: ReactNode
}

export function WorkoutDetails({
  onAddCardio,
  onSaveCardio,
  onRemoveCardio,
  workout,
  isSaving,
  onAddSet,
  onSaveExercise,
  onRemoveExercise,
  onSaveSet,
  onRemoveSet,
  isReordering,
  exerciseActions,
  addExercisePanel,
}: WorkoutDetailsProps) {
  const { weightUnit } = useMeasurementPreferences()
  const [expandedExerciseIds, setExpandedExerciseIds] = useState<Set<number>>(
    () => new Set(),
  )

  function toggleExerciseDetails(id: number) {
    setExpandedExerciseIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(id)) nextIds.delete(id)
      else nextIds.add(id)
      return nextIds
    })
  }

  return (
    <>
      <section
        className="MetricGrid WorkoutSummary"
        aria-label="Workout summary"
      >
        <article className="MetricCard">
          <span>Exercises</span>
          <strong>{workout.exercises.length}</strong>
        </article>
        <article className="MetricCard">
          <span>Strength Sets</span>
          <strong>{workout.totalSets}</strong>
        </article>
        <article className="MetricCard">
          <span>Strength Volume</span>
          <strong>
            {formatWeight(workout.totalVolume, weightUnit)} {weightUnit}
          </strong>
        </article>
        <article className="MetricCard">
          <span>Cardio Duration</span>
          <strong>{formatNumber(workout.totalCardioMinutes)} min</strong>
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

      <section className="ContentBand WorkoutExercisesSection">
        <div className="SectionHeader">
          <h2>Exercises</h2>
          <div className="RowActions">
            <span className="RecordCount">{workout.exercises.length}</span>
            {exerciseActions}
          </div>
        </div>

        {addExercisePanel}

        {isReordering ? (
          <p className="ReorderHint" role="status">
            Use Move Up and Move Down to arrange the exercises. Each move saves
            automatically.
          </p>
        ) : null}

        {workout.exercises.length === 0 ? (
          <p className="EmptyState">
            No exercises have been added to this workout.
          </p>
        ) : (
          <div className="WorkoutExerciseList">
            {workout.exercises.map((workoutExercise, index) => {
              const isExpanded =
                !isReordering && expandedExerciseIds.has(workoutExercise.id)
              const detailsId = `workout-exercise-details-${workoutExercise.id}`
              return (
              <article
                className={`WorkoutExerciseRow${isExpanded ? ' WorkoutExerciseRowExpanded' : ''}`}
                key={workoutExercise.id}
              >
                <div className="WorkoutExerciseHeader">
                  <div className="WorkoutExerciseIdentity">
                    <span className="WorkoutExerciseNumber">
                      Exercise {index + 1}
                    </span>
                    <h3>{workoutExercise.exercise.name}</h3>
                    <div className="ExerciseTypeLine">
                      <TrainingTypeBadge
                        trainingType={workoutExercise.exercise.trainingType}
                      />
                      {workoutExercise.exercise.muscleGroup ? (
                        <span>{workoutExercise.exercise.muscleGroup}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="RowActions">
                    {isReordering ? (
                      <div
                        className="ExerciseOrderControls"
                        role="group"
                        aria-label={`Reorder ${workoutExercise.exercise.name}`}
                      >
                      <button
                        className="Button ButtonSecondary OrderButton"
                        type="button"
                        disabled={isSaving || index === 0}
                        aria-label={`Move ${workoutExercise.exercise.name} up`}
                        title="Move up"
                        onClick={() => {
                          const previousExercise = workout.exercises[index - 1]
                          if (previousExercise) {
                            void onSaveExercise(workoutExercise.id, {
                              exerciseOrder: previousExercise.exerciseOrder,
                            })
                          }
                        }}
                      >
                        ↑ Move Up
                      </button>
                      <button
                        className="Button ButtonSecondary OrderButton"
                        type="button"
                        disabled={
                          isSaving || index === workout.exercises.length - 1
                        }
                        aria-label={`Move ${workoutExercise.exercise.name} down`}
                        title="Move down"
                        onClick={() => {
                          const nextExercise = workout.exercises[index + 1]
                          if (nextExercise) {
                            void onSaveExercise(workoutExercise.id, {
                              exerciseOrder: nextExercise.exerciseOrder,
                            })
                          }
                        }}
                      >
                        ↓ Move Down
                      </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="Button ButtonSecondary ExerciseDetailsToggle"
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={detailsId}
                          onClick={() =>
                            toggleExerciseDetails(workoutExercise.id)
                          }
                        >
                          {isExpanded ? 'Hide Details' : 'Show Details'}
                          <span
                            className={`DisclosureIcon${isExpanded ? ' DisclosureIconExpanded' : ''}`}
                            aria-hidden="true"
                          >
                            ▾
                          </span>
                        </button>
                        <DeleteButton
                          label="Remove"
                          title={`Remove ${workoutExercise.exercise.name}?`}
                          description="This removes the exercise and all its logged entries from this workout. The exercise stays in your library. This cannot be undone."
                          disabled={isSaving}
                          onDelete={() =>
                            onRemoveExercise(workoutExercise.id)
                          }
                        />
                      </>
                    )}
                  </div>
                  <span className="WorkoutExerciseTotal">
                    {workoutExercise.exercise.trainingType === 'CARDIO'
                      ? `${formatNumber(workoutExercise.cardioEntries.reduce((total, entry) => total + entry.durationMinutes, 0))} min`
                      : `${workoutExercise.sets.length} sets`}
                  </span>
                </div>
                {isExpanded ? (
                  <div className="WorkoutExerciseDetails" id={detailsId}>
                    {workoutExercise.exercise.instructions ? (
                      <div className="ExerciseInstructions">
                        <strong>Instructions</strong>
                        <p>{workoutExercise.exercise.instructions}</p>
                      </div>
                    ) : null}

                    {workoutExercise.exercise.trainingType === 'CARDIO' ? (
                      <CardioEntries
                        entries={workoutExercise.cardioEntries}
                        exerciseName={workoutExercise.exercise.name}
                        isSaving={isSaving}
                        onAdd={(request) =>
                          onAddCardio(workoutExercise.id, request)
                        }
                        onSave={onSaveCardio}
                        onDelete={onRemoveCardio}
                      />
                    ) : (
                      <>
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
                          onAdd={(request) =>
                            onAddSet(workoutExercise.id, request)
                          }
                        />
                      </>
                    )}
                  </div>
                ) : null}
              </article>
              )
            })}
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
  const { weightUnit } = useMeasurementPreferences()
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
                <td>
                  {formatWeight(set.weight, weightUnit)} {weightUnit}
                </td>
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

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    value,
  )
}
