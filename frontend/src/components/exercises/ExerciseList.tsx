import type { Exercise } from '../../types/exercise'

type ExerciseListProps = {
  exercises: Exercise[]
  isLoading: boolean
}

export function ExerciseList({ exercises, isLoading }: ExerciseListProps) {
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
            <article className="ExerciseCard" key={exercise.id}>
              <div>
                <h3>{exercise.name}</h3>
                <p>{exercise.muscleGroup}</p>
              </div>
              <span>{exercise.category}</span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
