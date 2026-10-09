import { useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import {
  getCardioProgress,
  getExercisePersonalRecord,
  getExerciseProgress,
} from '../api/progress'
import type {
  CardioProgress,
  ExercisePersonalRecord,
  ExerciseProgress,
} from '../types/progress'
import type { TrainingType } from '../types/exercise'

export function useExerciseProgress(
  exerciseId: number | null,
  trainingType?: TrainingType,
) {
  const [cardioProgress, setCardioProgress] = useState<CardioProgress | null>(
    null,
  )
  const [personalRecord, setPersonalRecord] =
    useState<ExercisePersonalRecord | null>(null)
  const [progress, setProgress] = useState<ExerciseProgress | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let ignoreResponse = false

    if (exerciseId === null) {
      setCardioProgress(null)
      setPersonalRecord(null)
      setProgress(null)
      setErrorMessage(null)
      setIsLoading(false)
      return
    }

    const selectedExerciseId = exerciseId

    async function loadProgress() {
      setIsLoading(true)
      setErrorMessage(null)
      setPersonalRecord(null)
      setProgress(null)
      setCardioProgress(null)

      try {
        if (trainingType === 'CARDIO') {
          const data = await getCardioProgress(selectedExerciseId)
          if (!ignoreResponse) setCardioProgress(data)
          return
        }
        const [personalRecordData, progressData] = await Promise.all([
          getExercisePersonalRecord(selectedExerciseId),
          getExerciseProgress(selectedExerciseId),
        ])

        if (!ignoreResponse) {
          setPersonalRecord(personalRecordData)
          setProgress(progressData)
        }
      } catch (error) {
        if (!ignoreResponse) {
          setPersonalRecord(null)
          setProgress(null)
          setErrorMessage(getErrorMessage(error))
        }
      } finally {
        if (!ignoreResponse) {
          setIsLoading(false)
        }
      }
    }

    void loadProgress()

    return () => {
      ignoreResponse = true
    }
  }, [exerciseId, trainingType])

  return { personalRecord, progress, cardioProgress, isLoading, errorMessage }
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && isApiErrorDetails(error.details)) {
    return error.details.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Could not load exercise progress.'
}

function isApiErrorDetails(details: unknown): details is { message: string } {
  return (
    typeof details === 'object' &&
    details !== null &&
    'message' in details &&
    typeof details.message === 'string'
  )
}
