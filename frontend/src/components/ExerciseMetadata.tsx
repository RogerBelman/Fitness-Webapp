import type { Exercise } from '../types/exercise'
import { TrainingTypeBadge } from './TrainingTypeBadge'

type ExerciseMetadataProps = {
  exercise: Pick<Exercise, 'trainingType' | 'muscleGroup' | 'muscleFocus'>
  showFocus?: boolean
}

export function ExerciseMetadata({ exercise, showFocus = false }: ExerciseMetadataProps) {
  return (
    <div className="ExerciseTypeLine">
      <TrainingTypeBadge trainingType={exercise.trainingType} />
      {exercise.muscleGroup ? (
        <span className="ExerciseMuscleGroup">{exercise.muscleGroup}</span>
      ) : null}
      {showFocus && exercise.trainingType === 'STRENGTH' && exercise.muscleFocus ? (
        <span className="ExerciseMuscleFocus">Focus: {exercise.muscleFocus}</span>
      ) : null}
    </div>
  )
}
