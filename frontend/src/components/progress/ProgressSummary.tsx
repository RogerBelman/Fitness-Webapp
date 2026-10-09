import { Link } from 'react-router-dom'
import type {
  ExercisePersonalRecord,
  ExerciseProgress,
} from '../../types/progress'
import { ProgressChart } from './ProgressChart'

type ProgressSummaryProps = {
  personalRecord: ExercisePersonalRecord
  progress: ExerciseProgress
}

export function ProgressSummary({
  personalRecord,
  progress,
}: ProgressSummaryProps) {
  const latestPoint = progress.history.at(-1)

  return (
    <>
      <section
        className="MetricGrid"
        aria-label={`${progress.exerciseName} summary`}
      >
        <article className="MetricCard">
          <span>Heaviest Set</span>
          <strong>
            {personalRecord.personalRecord
              ? `${formatWeight(personalRecord.personalRecord.weight)} lb`
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
            {latestPoint ? `${formatWeight(latestPoint.totalVolume)} lb` : '--'}
          </strong>
          <small>
            {latestPoint
              ? formatWorkoutDate(latestPoint.workoutDate)
              : 'No history'}
          </small>
        </article>
      </section>

      <p className="ExerciseTrackingHint">
        Your strength record is the heaviest logged set, with more reps breaking
        a tie. Volume is the sum of weight × reps across this exercise’s sets in
        a workout.
      </p>

      {progress.history.length > 0 ? (
        <ProgressChart
          exerciseName={progress.exerciseName}
          history={progress.history}
        />
      ) : null}

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
                    <td>{formatWeight(point.maxWeight)} lb</td>
                    <td>{formatWeight(point.totalVolume)} lb</td>
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
    </>
  )
}

function formatWeight(weight: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    weight,
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
