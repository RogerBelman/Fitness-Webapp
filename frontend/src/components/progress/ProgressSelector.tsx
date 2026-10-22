import { Link } from 'react-router-dom'
import type { Exercise } from '../../types/exercise'
import { ExerciseOptions } from '../ExerciseOptions'

type ProgressSelectorProps = {
  exercises: Exercise[]
  isLoading: boolean
  selectedExerciseId: number | null
  onChange: (exerciseId: number | null) => void
}

export function ProgressSelector({
  exercises,
  isLoading,
  selectedExerciseId,
  onChange,
}: ProgressSelectorProps) {
  const hasExercises = exercises.length > 0

  return (
    <section className="ProgressControls" aria-labelledby="progress-heading">
      <div className="ProgressControlsHeader">
        <h2 id="progress-heading">Exercise Progress</h2>
        {!isLoading && !hasExercises ? (
          <Link to="/exercises">Add Exercise</Link>
        ) : null}
      </div>

      <label>
        Exercise
        <select
          disabled={isLoading || !hasExercises}
          onChange={(event) =>
            onChange(event.target.value ? Number(event.target.value) : null)
          }
          value={selectedExerciseId ?? ''}
        >
          <option value="">
            {isLoading ? 'Loading exercises...' : 'Select exercise'}
          </option>
          <ExerciseOptions exercises={exercises} />
        </select>
      </label>
    </section>
  )
}
