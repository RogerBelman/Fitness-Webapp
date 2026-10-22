import type { Exercise } from '../types/exercise'

export function ExerciseGuidance({ exercise }: { exercise: Exercise }) {
  const details: Array<[string, string]> = []
  if (exercise.trainingType === 'STRENGTH') {
    if (exercise.muscleFocus) details.push(['Focus', exercise.muscleFocus])
    if (exercise.movementType) {
      details.push(['Movement', exercise.movementType === 'COMPOUND' ? 'Compound' : 'Isolation'])
    }
    if (exercise.targetWorkingSets != null) {
      details.push(['Target Sets', String(exercise.targetWorkingSets)])
    }
    if (exercise.repRangeMin != null && exercise.repRangeMax != null) {
      details.push(['Target Reps', range(exercise.repRangeMin, exercise.repRangeMax)])
    }
  } else if (exercise.durationMinMinutes != null) {
    details.push(['Target Duration', exercise.durationMaxMinutes == null
      ? `At least ${exercise.durationMinMinutes} min`
      : `${range(exercise.durationMinMinutes, exercise.durationMaxMinutes)} min`])
  } else if (exercise.durationMaxMinutes != null) {
    details.push(['Target Duration', `Up to ${exercise.durationMaxMinutes} min`])
  }
  return details.length ? (
    <dl className="ExerciseGuidance">
      {details.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  ) : null
}

function range(min: number, max: number) {
  return min === max ? String(min) : `${min}–${max}`
}
