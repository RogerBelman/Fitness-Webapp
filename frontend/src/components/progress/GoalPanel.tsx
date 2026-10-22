import { useMemo, useState, type FormEvent } from 'react'
import { useMeasurementPreferences } from '../../hooks/useMeasurementPreferences'
import { DeleteButton } from '../DeleteButton'
import { ExerciseOptions } from '../ExerciseOptions'
import type { Exercise } from '../../types/exercise'
import type { ExerciseGoal, ExerciseGoalRequest, GoalMetric } from '../../types/goal'
import {
  formatWeight,
  isWeightMetric,
  toPounds,
  weightInputValue,
} from '../../utils/weightMeasurement'

type GoalPanelProps = {
  exercises: Exercise[]
  goals: ExerciseGoal[]
  isLoading: boolean
  isSaving: boolean
  errorMessage: string | null
  onCreate: (request: ExerciseGoalRequest) => Promise<boolean>
  onUpdate: (id: number, request: ExerciseGoalRequest) => Promise<boolean>
  onDelete: (id: number) => Promise<boolean>
}

export function GoalPanel(props: GoalPanelProps) {
  const { weightUnit } = useMeasurementPreferences()
  const [isCreating, setIsCreating] = useState(false)
  const [exerciseId, setExerciseId] = useState<number | null>(null)
  const selected = props.exercises.find((exercise) => exercise.id === exerciseId)
  const metrics = getMetrics(selected?.trainingType)
  const [metric, setMetric] = useState<GoalMetric>('STRENGTH_MAX_WEIGHT')
  const [target, setTarget] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTarget, setEditTarget] = useState('')
  const sortedGoals = useMemo(
    () => [...props.goals].sort((a, b) => a.exercise.name.localeCompare(b.exercise.name)),
    [props.goals],
  )

  function changeExercise(value: string) {
    const id = value ? Number(value) : null
    setExerciseId(id)
    const exercise = props.exercises.find((item) => item.id === id)
    setMetric(getMetrics(exercise?.trainingType)[0]?.value ?? 'STRENGTH_MAX_WEIGHT')
    setTarget('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!exerciseId || !target) return
    const targetValue = isWeightMetric(metric)
      ? toPounds(Number(target), weightUnit)
      : Number(target)
    if (await props.onCreate({ exerciseId, metric, targetValue })) {
      setTarget('')
      setExerciseId(null)
      setIsCreating(false)
    }
  }

  async function save(goal: ExerciseGoal) {
    if (!editTarget) return
    if (await props.onUpdate(goal.id, {
      exerciseId: goal.exercise.id,
      metric: goal.metric,
      targetValue: isWeightMetric(goal.metric)
        ? toPounds(Number(editTarget), weightUnit)
        : Number(editTarget),
    })) setEditingId(null)
  }

  return (
    <section className="ContentBand GoalPanel">
      <div className="SectionHeader">
        <div>
          <h2>Exercise Goals</h2>
          <p className="SectionDescription">
            Set measurable targets and track them from your logged workouts.
          </p>
        </div>
        <div className="GoalHeaderActions">
          <span className="RecordCount">{props.goals.length}</span>
          <button
            className="Button ButtonPrimary"
            type="button"
            disabled={props.isSaving || props.exercises.length === 0}
            onClick={() => setIsCreating((current) => !current)}
          >
            {isCreating ? 'Close Form' : 'Add Goal'}
          </button>
        </div>
      </div>
      {props.errorMessage ? (
        <p className="Alert AlertError" role="alert">
          {props.errorMessage}
        </p>
      ) : null}
      {isCreating ? (
        <form className="GoalForm" onSubmit={(event) => void submit(event)}>
          <div className="GoalFormHeader">
            <h3>Create a Goal</h3>
            <p>Choose an exercise, measurement, and target.</p>
          </div>
          <div className="GoalFormFields">
            <label>
              Exercise
              <select
                value={exerciseId ?? ''}
                onChange={(event) => changeExercise(event.target.value)}
                disabled={props.isSaving}
                required
              >
                <option value="">Select exercise</option>
                <ExerciseOptions exercises={props.exercises} />
              </select>
            </label>
            <label>
              Measurement
              <select
                value={metric}
                onChange={(event) =>
                  setMetric(event.target.value as GoalMetric)
                }
                disabled={!selected || props.isSaving}
              >
                {metrics.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target {selected ? `(${unitForMetric(metric, weightUnit)})` : ''}
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                disabled={props.isSaving}
                required
              />
            </label>
          </div>
          <div className="FormActions GoalFormActions">
            <button
              className="Button ButtonSecondary"
              type="button"
              disabled={props.isSaving}
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </button>
            <button
              className="Button ButtonPrimary"
              type="submit"
              disabled={!selected || props.isSaving}
            >
              Save Goal
            </button>
          </div>
        </form>
      ) : null}
      {props.isLoading ? <p className="EmptyState">Loading goals...</p> : null}
      {!props.isLoading && sortedGoals.length === 0 ? <p className="EmptyState">No goals yet.</p> : null}
      <div className="GoalList">
        {sortedGoals.map((goal) => {
          const percent = Math.min(100, goal.targetValue ? (goal.currentValue / goal.targetValue) * 100 : 0)
          return <article className="GoalCard" key={goal.id}>
            <div className="GoalCardHeader"><div><h3>{goal.exercise.name}</h3><p>{labelForMetric(goal.metric)}</p></div><div className="GoalValue"><strong>{formatGoalValue(goal.currentValue, goal.metric, weightUnit)} / {formatGoalValue(goal.targetValue, goal.metric, weightUnit)} {unitForMetric(goal.metric, weightUnit)}</strong>{goal.achieved ? <span>Goal reached</span> : null}</div></div>
            <div className="GoalProgress" role="progressbar" aria-label={`${goal.exercise.name} ${labelForMetric(goal.metric)}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}><span style={{ width: `${percent}%` }} /></div>
            {editingId === goal.id ? <div className="GoalEdit"><label>New target ({unitForMetric(goal.metric, weightUnit)})<input type="number" min="0.01" step="0.01" value={editTarget} onChange={(event) => setEditTarget(event.target.value)} /></label><button className="Button ButtonPrimary" type="button" disabled={props.isSaving} onClick={() => void save(goal)}>Save</button><button className="Button ButtonSecondary" type="button" onClick={() => setEditingId(null)}>Cancel</button></div> : <div className="RowActions"><button className="Button ButtonSecondary" type="button" onClick={() => { setEditingId(goal.id); setEditTarget(isWeightMetric(goal.metric) ? weightInputValue(goal.targetValue, weightUnit) : String(goal.targetValue)) }}>Edit Target</button><DeleteButton disabled={props.isSaving} title="Delete goal?" description={`Delete the ${labelForMetric(goal.metric).toLowerCase()} goal for ${goal.exercise.name}?`} onDelete={() => props.onDelete(goal.id)} /></div>}
          </article>
        })}
      </div>
    </section>
  )
}

function getMetrics(type?: Exercise['trainingType']) {
  return type === 'CARDIO'
    ? [{ value: 'CARDIO_DURATION' as const, label: 'Max workout duration' }, { value: 'CARDIO_LEVEL' as const, label: 'Max level' }]
    : [{ value: 'STRENGTH_MAX_WEIGHT' as const, label: 'Max weight' }, { value: 'STRENGTH_MAX_VOLUME' as const, label: 'Max workout volume' }]
}

function labelForMetric(metric: GoalMetric) {
  return getMetrics(metric.startsWith('CARDIO') ? 'CARDIO' : 'STRENGTH').find((item) => item.value === metric)?.label ?? metric
}

function unitForMetric(metric: GoalMetric, weightUnit: 'lb' | 'kg') {
  if (metric === 'CARDIO_DURATION') return 'min'
  if (metric === 'CARDIO_LEVEL') return 'level'
  return weightUnit
}

function formatGoalValue(
  value: number,
  metric: GoalMetric,
  weightUnit: 'lb' | 'kg',
) {
  return isWeightMetric(metric)
    ? formatWeight(value, weightUnit)
    : formatValue(value)
}

function formatValue(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}
