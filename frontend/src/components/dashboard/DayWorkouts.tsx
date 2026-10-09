import { Link } from 'react-router-dom'
import type { Workout, WorkoutDetail } from '../../types/workout'
import { formatCalendarDate } from '../../utils/workoutCalendar'

type DayWorkoutsProps = {
  date: string
  today: string
  workouts: Workout[]
  details: WorkoutDetail[]
  isLoading: boolean
  isLoadingDetails: boolean
  errorMessage: string | null
}

export function DayWorkouts({
  date,
  today,
  workouts,
  details,
  isLoading,
  isLoadingDetails,
  errorMessage,
}: DayWorkoutsProps) {
  const selectedWorkouts = workouts.filter(
    (workout) => workout.workoutDate === date,
  )
  const fullDate = formatCalendarDate(date, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const canLogWorkout = date <= today

  return (
    <section
      className="ContentBand DayWorkouts"
      aria-labelledby="day-heading"
      aria-busy={isLoading || isLoadingDetails}
    >
      <div className="DayHeader">
        <div>
          <p className="WeekEyebrow">Selected day</p>
          <h2 id="day-heading">{fullDate}</h2>
        </div>
        {canLogWorkout ? (
          <Link
            className="Button ButtonPrimary"
            to={`/workouts?new=1&date=${date}`}
          >
            Add Workout
          </Link>
        ) : null}
      </div>
      {isLoading ? (
        <p className="EmptyState" role="status">
          Loading workouts...
        </p>
      ) : null}
      {!isLoading && selectedWorkouts.length === 0 ? (
        <div className="DayEmptyState">
          <p>No workouts logged for this day.</p>
          <p>
            {canLogWorkout
              ? 'Add a workout to start recording strength and cardio exercises.'
              : 'Workout logging is available for today and past dates.'}
          </p>
        </div>
      ) : null}
      {errorMessage ? (
        <p className="Alert AlertError" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {!isLoading
        ? selectedWorkouts.map((workout) => {
            const detail = details.find((item) => item.id === workout.id)
            return (
              <article className="DayWorkout" key={workout.id}>
                <div className="DayWorkoutHeader">
                  <div>
                    <h3>{workout.title || 'Untitled Workout'}</h3>
                    <p>
                      {workout.totalSets}{' '}
                      {workout.totalSets === 1 ? 'set' : 'sets'} ·{' '}
                      {formatVolume(workout.totalVolume)} lb strength volume ·{' '}
                      {formatVolume(workout.totalCardioMinutes)} min cardio
                    </p>
                  </div>
                  <Link
                    className="Button ButtonSecondary"
                    to={`/workouts/${workout.id}`}
                  >
                    Open Workout
                  </Link>
                </div>
                {workout.notes ? (
                  <p className="DayWorkoutNotes">{workout.notes}</p>
                ) : null}
                {isLoadingDetails ? (
                  <p className="EmptyState" role="status">
                    Loading exercises...
                  </p>
                ) : null}
                {detail && detail.exercises.length === 0 ? (
                  <p className="EmptyState">
                    No exercises added yet. Open this workout to start logging.
                  </p>
                ) : null}
                {detail && detail.exercises.length > 0 ? (
                  <ul className="DayExerciseList">
                    {detail.exercises.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.exercise.name}</strong>
                          <span>
                            {item.exercise.trainingType === 'CARDIO'
                              ? 'Cardio'
                              : 'Strength'}
                            {item.exercise.muscleGroup
                              ? ` · ${item.exercise.muscleGroup}`
                              : ''}
                          </span>
                          {item.exercise.instructions ? (
                            <details className="DayExerciseInstructions">
                              <summary>Instructions</summary>
                              <p>{item.exercise.instructions}</p>
                            </details>
                          ) : null}
                        </div>
                        <span>
                          {item.exercise.trainingType === 'CARDIO'
                            ? `${formatVolume(item.cardioEntries.reduce((total, entry) => total + entry.durationMinutes, 0))} min`
                            : `${item.sets.length} ${item.sets.length === 1 ? 'set' : 'sets'}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            )
          })
        : null}
    </section>
  )
}

function formatVolume(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    value,
  )
}
