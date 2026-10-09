import type { TrainingType } from '../types/exercise'

export function getTrainingTypeIcon(trainingType: TrainingType) {
  return trainingType === 'CARDIO' ? '❤️' : '💪'
}

export function getTrainingTypeLabel(trainingType: TrainingType) {
  return trainingType === 'CARDIO' ? 'Cardio' : 'Strength'
}

export function getTrainingTypeOptionLabel(trainingType: TrainingType) {
  return `${getTrainingTypeIcon(trainingType)} ${getTrainingTypeLabel(trainingType)}`
}
