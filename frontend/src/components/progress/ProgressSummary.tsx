import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMeasurementPreferences } from '../../hooks/useMeasurementPreferences'
import type {
  ExercisePersonalRecord,
  ExerciseProgress,
} from '../../types/progress'
import { ProgressChart } from './ProgressChart'
import { formatWeight } from '../../utils/weightMeasurement'

type ProgressSummaryProps = {
  personalRecord: ExercisePersonalRecord
  progress: ExerciseProgress
}

export function ProgressSummary({
  personalRecord,
  progress,
}: ProgressSummaryProps) {
  const { weightUnit } = useMeasurementPreferences()
  const [metric, setMetric] = useState<'maxWeight' | 'totalVolume'>(
    'maxWeight',
  )
  const latestPoint = progress.history.at(-1)
  const maxVolumePoint = progress.history.reduce(
    (best, point) =>
      !best || point.totalVolume > best.totalVolume ? point : best,
    progress.history[0],
  )
  return (
    <>
      <section
        className="MetricGrid WorkoutSummary"
        aria-label={`${progress.exerciseName} summary`}
      >
        <article className="MetricCard">
          <span>Heaviest Set</span>
          <strong>
            {personalRecord.personalRecord
              ? `${formatWeight(personalRecord.personalRecord.weight, weightUnit)} ${weightUnit}`
              : '--'}
          </strong>
          <small>
            {personalRecord.personalRecord
              ? `${personalRecord.personalRecord.reps} reps`
              : 'No sets logged'}
          </small>
        </article>
        <article className="MetricCard">
          <span>Sessions</span>
          <strong>{progress.history.length}</strong>
          <small>{progress.exerciseName}</small>
        </article>
        <article className="MetricCard">
          <span>Latest Volume</span>
          <strong>
            {latestPoint
              ? `${formatWeight(latestPoint.totalVolume, weightUnit)} ${weightUnit}`
              : '--'}
          </strong>
          <small>
            {latestPoint
              ? formatWorkoutDate(latestPoint.workoutDate)
              : 'No history'}
          </small>
        </article>
        <article className="MetricCard">
          <span>Max Workout Volume</span>
          <strong>
            {maxVolumePoint
              ? `${formatWeight(maxVolumePoint.totalVolume, weightUnit)} ${weightUnit}`
              : '--'}
          </strong>
          <small>
            {maxVolumePoint
              ? formatWorkoutDate(maxVolumePoint.workoutDate)
              : 'No history'}
          </small>
        </article>
      </section>

      <section className="ProgressControls" aria-label="Strength chart options">
        <label>
          Chart Metric
          <select
            value={metric}
            onChange={(event) =>
              setMetric(event.target.value as typeof metric)
            }
          >
            <option value="maxWeight">Maximum weight per workout</option>
            <option value="totalVolume">Volume per workout</option>
          </select>
        </label>
        <p className="ExerciseTrackingHint">
          Your strength record is the heaviest logged set, with more reps
          breaking a tie. Volume is the sum of weight × reps across this
          exercise’s sets in a workout.
        </p>
      </section>

      {progress.history.length > 0 ? (
        <ProgressChart
          exerciseName={progress.exerciseName}
          history={progress.history}
          metric={metric}
        />
      ) : null}
      <WorkoutProgressHistory progress={progress} />
    </>
  )
}

function WorkoutProgressHistory({
  progress,
}: {
  progress: ExerciseProgress
}) {
  const { weightUnit } = useMeasurementPreferences()
  return (
    <section className="ContentBand">
      <div className="SectionHeader">
        <h2>Workout Progress</h2>
        <span className="RecordCount">{progress.history.length}</span>
      </div>

      {progress.history.length === 0 ? (
        <p className="EmptyState">
          No sets yet. Add this exercise to a workout and log a set to start
          tracking progress.
        </p>
      ) : (
        <div className="TableScroll">
          <table className="ProgressTable">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Sets</th>
                <th scope="col">Max Weight</th>
                <th scope="col">Volume</th>
                <th scope="col">
                  <span className="VisuallyHidden">Workout</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {progress.history.map((point) => (
                <tr key={point.workoutId}>
                  <td>{formatWorkoutDate(point.workoutDate)}</td>
                  <td>{point.totalSets}</td>
                  <td>
                    {formatWeight(point.maxWeight, weightUnit)} {weightUnit}
                  </td>
                  <td>
                    {formatWeight(point.totalVolume, weightUnit)} {weightUnit}
                  </td>
                  <td>
                    <Link to={`/workouts/${point.workoutId}`}>Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function formatWorkoutDate(workoutDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${workoutDate}T00:00:00Z`))
}
