import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CardioProgress } from '../../types/progress'
import { ProgressChart } from './ProgressChart'

export function CardioProgressSummary({
  progress,
}: {
  progress: CardioProgress
}) {
  const [metric, setMetric] = useState<'totalDurationMinutes' | 'maxLevel'>(
    'totalDurationMinutes',
  )
  const { history } = progress
  const totalMinutes = history.reduce(
    (total, point) => total + point.totalDurationMinutes,
    0,
  )
  const longest = history.reduce(
    (max, point) => Math.max(max, point.totalDurationMinutes),
    0,
  )
  const levels = history.flatMap((point) =>
    point.maxLevel === null ? [] : [point.maxLevel],
  )

  return (
    <>
      <section
        className="MetricGrid WorkoutSummary"
        aria-label={`${progress.exerciseName} cardio summary`}
      >
        <article className="MetricCard">
          <span>Workouts</span>
          <strong>{history.length}</strong>
          <small>With logged cardio</small>
        </article>
        <article className="MetricCard">
          <span>Total Duration</span>
          <strong>{formatNumber(totalMinutes)} min</strong>
          <small>Across all workouts</small>
        </article>
        <article className="MetricCard">
          <span>Longest Workout Duration</span>
          <strong>
            {history.length ? `${formatNumber(longest)} min` : '--'}
          </strong>
          <small>Combined entries in one workout</small>
        </article>
        <article className="MetricCard">
          <span>Highest Recorded Level</span>
          <strong>
            {levels.length ? formatNumber(Math.max(...levels)) : '--'}
          </strong>
          <small>
            {levels.length ? 'For this exercise' : 'No levels recorded'}
          </small>
        </article>
      </section>

      {history.length > 0 ? (
        <>
          <section
            className="ProgressControls"
            aria-label="Cardio chart options"
          >
            <label>
              Chart Metric
              <select
                value={metric}
                onChange={(event) =>
                  setMetric(event.target.value as typeof metric)
                }
              >
                <option value="totalDurationMinutes">
                  Duration per workout
                </option>
                <option value="maxLevel" disabled={levels.length === 0}>
                  Highest level per workout
                </option>
              </select>
            </label>
            <p className="ExerciseTrackingHint">
              Duration combines all entries for this exercise in each workout.
              Use duration and level together when comparing sessions on the same
              machine. Missing levels stay blank.
            </p>
          </section>
          <ProgressChart
            exerciseName={progress.exerciseName}
            history={history}
            metric={metric}
          />
        </>
      ) : null}
      <CardioProgressHistory progress={progress} />
    </>
  )
}

function CardioProgressHistory({
  progress,
}: {
  progress: CardioProgress
}) {
  const { history } = progress

  return (
    <section className="ContentBand">
      <div className="SectionHeader">
        <h2>Cardio History</h2>
        <span className="RecordCount">{history.length}</span>
      </div>
      {history.length === 0 ? (
        <p className="EmptyState">
          No cardio entries yet. Add this exercise to a workout and log its
          duration to start tracking progress.
        </p>
      ) : (
        <div className="TableScroll">
          <table className="ProgressTable ResponsiveTable">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Entries</th>
                <th scope="col">Duration</th>
                <th scope="col">Highest Level</th>
                <th scope="col">
                  <span className="VisuallyHidden">Workout</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((point) => (
                <tr key={point.workoutId}>
                  <td data-label="Date">
                    {new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC',
                    }).format(new Date(`${point.workoutDate}T00:00:00Z`))}
                  </td>
                  <td data-label="Entries">{point.totalEntries}</td>
                  <td data-label="Duration">{formatNumber(point.totalDurationMinutes)} min</td>
                  <td data-label="Highest Level">
                    {point.maxLevel === null
                      ? 'Not recorded'
                      : formatNumber(point.maxLevel)}
                  </td>
                  <td data-label="Workout">
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

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    value,
  )
}
