import type { TrainingType } from '../types/exercise'
import {
  getTrainingTypeIcon,
  getTrainingTypeLabel,
} from '../utils/trainingTypeDisplay'

type TrainingTypeBadgeProps = {
  trainingType: TrainingType
}

export function TrainingTypeBadge({ trainingType }: TrainingTypeBadgeProps) {
  const label = getTrainingTypeLabel(trainingType)

  return (
    <span
      className={`TrainingTypeBadge TrainingTypeBadge${label}`}
      aria-label={label}
    >
      <span className="TrainingTypeIcon" aria-hidden="true">
        {getTrainingTypeIcon(trainingType)}
      </span>
      {label}
    </span>
  )
}
