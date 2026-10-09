import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { ProgressSelector } from '../components/progress/ProgressSelector'
import { ProgressSummary } from '../components/progress/ProgressSummary'
import { CardioProgressSummary } from '../components/progress/CardioProgressSummary'
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
  } = useExercises()
  const selectedExercise = exercises.find(
    (exercise) => exercise.id === selectedExerciseId,
  )
  const {
    personalRecord,
    progress,
    cardioProgress,
    isLoading: isLoadingProgress,
    errorMessage: progressError,
  } = useExerciseProgress(selectedExerciseId, selectedExercise?.trainingType)

  return (
    <section className="PageStack">
      <PageHeader
        title="Progress"
        description="Explore strength records, cardio duration, and exercise history."
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
            Choose a strength or cardio exercise to see its trends and workout
            history.
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
      {!isLoadingProgress &&
      personalRecord &&
      progress?.exerciseId === selectedExerciseId ? (
        <ProgressSummary personalRecord={personalRecord} progress={progress} />
      ) : null}
      {!isLoadingProgress &&
      cardioProgress?.exerciseId === selectedExerciseId &&
      cardioProgress ? (
        <CardioProgressSummary
          key={cardioProgress.exerciseId}
          progress={cardioProgress}
        />
      ) : null}
    </section>
  )
}
