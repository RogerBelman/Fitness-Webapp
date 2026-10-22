import type { Exercise } from '../types/exercise'
import {
  compareExercisesByTrainingTypeAndName,
  getTrainingTypeOptionLabel,
} from '../utils/trainingTypeDisplay'

export function ExerciseOptions({ exercises }: { exercises: Exercise[] }) {
  return [...exercises].sort(compareExercisesByTrainingTypeAndName).map((exercise) => (
    <option key={exercise.id} value={exercise.id}>
      {getTrainingTypeOptionLabel(exercise.trainingType)} — {exercise.name}
      {exercise.muscleGroup ? ` (${exercise.muscleGroup})` : ''}
    </option>
  ))
}
