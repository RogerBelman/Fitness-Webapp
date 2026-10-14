import type { Exercise, TrainingType } from '../types/exercise'

const trainingTypeOrder: Record<TrainingType, number> = {
  STRENGTH: 0,
  CARDIO: 1,
}

const exerciseNameCollator = new Intl.Collator('en-US', {
  numeric: true,
  sensitivity: 'base',
})

export function getTrainingTypeIcon(trainingType: TrainingType) {
  return trainingType === 'CARDIO' ? '❤️' : '💪'
}

export function getTrainingTypeLabel(trainingType: TrainingType) {
  return trainingType === 'CARDIO' ? 'Cardio' : 'Strength'
}

export function getTrainingTypeOptionLabel(trainingType: TrainingType) {
  return `${getTrainingTypeIcon(trainingType)} ${getTrainingTypeLabel(trainingType)}`
}

export function compareExercisesByTrainingTypeAndName(
  left: Pick<Exercise, 'trainingType' | 'name'>,
  right: Pick<Exercise, 'trainingType' | 'name'>,
) {
  const trainingTypeDifference =
    trainingTypeOrder[left.trainingType] - trainingTypeOrder[right.trainingType]

  return (
    trainingTypeDifference || exerciseNameCollator.compare(left.name, right.name)
  )
}
