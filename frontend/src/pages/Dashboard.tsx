import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { ProgressSelector } from '../components/progress/ProgressSelector'
import { ProgressSummary } from '../components/progress/ProgressSummary'
import { useExerciseProgress } from '../hooks/useExerciseProgress'
import { useExercises } from '../hooks/useExercises'

export function Dashboard() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null)
  const {
    exercises,
    isLoading: isLoadingExercises,
    errorMessage: exercisesError,
  } = useExercises('', '')
  const {
    personalRecord,
    progress,
    isLoading: isLoadingProgress,
    errorMessage: progressError,
  } = useExerciseProgress(selectedExerciseId)

  return (
    <section className="PageStack">
      <PageHeader
        title="Dashboard"
        description="Training overview and progress snapshots."
        actions={
          <Link className="Button ButtonPrimary" to="/workouts/new">
            New Workout
          </Link>
        }
      />

      {exercisesError ? <p className="Alert AlertError">{exercisesError}</p> : null}
      {progressError ? <p className="Alert AlertError">{progressError}</p> : null}

      <ProgressSelector
        exercises={exercises}
        isLoading={isLoadingExercises}
        onChange={setSelectedExerciseId}
        selectedExerciseId={selectedExerciseId}
      />

      {isLoadingProgress ? (
        <section className="ContentBand">
          <p className="EmptyState">Loading progress...</p>
        </section>
      ) : null}

      {!isLoadingProgress && personalRecord && progress ? (
        <ProgressSummary personalRecord={personalRecord} progress={progress} />
      ) : null}
    </section>
  )
}
