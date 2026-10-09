import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { ProgressSelector } from '../components/progress/ProgressSelector'
import { ProgressSummary } from '../components/progress/ProgressSummary'
import { useExerciseProgress } from '../hooks/useExerciseProgress'
import { useExercises } from '../hooks/useExercises'

export function Progress() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(
    null,
  )
  const {
    exercises,
    isLoading: isLoadingExercises,
    errorMessage: exercisesError,
  } = useExercises('', 'STRENGTH')
  const {
    personalRecord,
    progress,
    isLoading: isLoadingProgress,
    errorMessage: progressError,
  } = useExerciseProgress(selectedExerciseId)

  return (
    <section className="PageStack">
      <PageHeader
        title="Progress"
        description="Strength personal records and performance over time."
      />
      {exercisesError ? (
        <p className="Alert AlertError" role="alert">
          {exercisesError}
        </p>
      ) : null}
      {progressError ? (
        <p className="Alert AlertError" role="alert">
          {progressError}
        </p>
      ) : null}
      <ProgressSelector
        exercises={exercises}
        isLoading={isLoadingExercises}
        onChange={setSelectedExerciseId}
        selectedExerciseId={selectedExerciseId}
      />
      {!selectedExerciseId && !isLoadingExercises && exercises.length > 0 ? (
        <section className="ContentBand">
          <p className="EmptyState">
            Choose an exercise to see your personal record, weight trend, and
            workout history.
          </p>
        </section>
      ) : null}
      {isLoadingProgress ? (
        <section className="ContentBand">
          <p className="EmptyState" role="status">
            Loading progress...
          </p>
        </section>
      ) : null}
      {!isLoadingProgress && personalRecord && progress ? (
        <ProgressSummary personalRecord={personalRecord} progress={progress} />
      ) : null}
    </section>
  )
}
