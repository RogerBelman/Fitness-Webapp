import { Link } from 'react-router-dom'
import type { Workout } from '../../types/workout'

type WorkoutListProps = {
  workouts: Workout[]
  isLoading: boolean
}

export function WorkoutList({ workouts, isLoading }: WorkoutListProps) {
  return (
    <section className="ContentBand">
      <div className="SectionHeader">
        <h2>Workout History</h2>
        <span className="RecordCount">{workouts.length}</span>
      </div>

      {isLoading ? <p className="EmptyState">Loading workouts...</p> : null}

      {!isLoading && workouts.length === 0 ? (
        <p className="EmptyState">No workout history yet.</p>
      ) : null}

      {!isLoading && workouts.length > 0 ? (
        <div className="WorkoutList">
          {workouts.map((workout) => (
            <Link
              className="WorkoutRow"
              key={workout.id}
              to={`/workouts/${workout.id}`}
            >
              <div className="WorkoutIdentity">
                <time dateTime={workout.workoutDate}>
                  {formatWorkoutDate(workout.workoutDate)}
                </time>
                <h3>{workout.title || 'Untitled Workout'}</h3>
                {workout.notes ? <p>{workout.notes}</p> : null}
              </div>

              <dl className="WorkoutMetrics">
                <div>
                  <dt>Strength Sets</dt>
                  <dd>{workout.totalSets}</dd>
                </div>
                <div>
                  <dt>Strength Volume</dt>
                  <dd>{formatVolume(workout.totalVolume)} lb</dd>
                </div>
                <div>
                  <dt>Cardio</dt>
                  <dd>{formatVolume(workout.totalCardioMinutes)} min</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      ) : null}
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

function formatVolume(totalVolume: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    totalVolume,
  )
}
