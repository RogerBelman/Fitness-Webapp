import type { SetEntry, WorkoutDetail } from '../../types/workout'

type WorkoutDetailsProps = {
  workout: WorkoutDetail
}

export function WorkoutDetails({ workout }: WorkoutDetailsProps) {
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
          <p className="EmptyState">No exercises have been added to this workout.</p>
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
                  <span>{workoutExercise.sets.length} sets</span>
                </div>

                {workoutExercise.notes ? (
                  <p className="WorkoutExerciseNotes">{workoutExercise.notes}</p>
                ) : null}

                {workoutExercise.sets.length === 0 ? (
                  <p className="EmptyState">No sets logged.</p>
                ) : (
                  <SetTable sets={workoutExercise.sets} />
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function SetTable({ sets }: { sets: SetEntry[] }) {
  return (
    <div className="TableScroll">
      <table className="SetTable">
        <thead>
          <tr>
            <th scope="col">Set</th>
            <th scope="col">Reps</th>
            <th scope="col">Weight</th>
          </tr>
        </thead>
        <tbody>
          {sets.map((set) => (
            <tr key={set.id}>
              <td>{set.setNumber}</td>
              <td>{set.reps}</td>
              <td>{formatWeight(set.weight)} lb</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatWeight(weight: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(weight)
}
