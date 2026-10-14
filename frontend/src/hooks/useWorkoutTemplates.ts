import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import * as api from '../api/workoutTemplates'
import type { WorkoutDetail } from '../types/workout'
import type {
  StartTemplateWorkoutRequest,
  WorkoutTemplate,
  WorkoutTemplateRequest,
} from '../types/workoutTemplate'

export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const saving = useRef(false)

  useEffect(() => {
    let active = true
    api
      .listWorkoutTemplates()
      .then((data) => {
        if (active) setTemplates(data)
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(getErrorMessage(error))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    if (saving.current) return null
    saving.current = true
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      return await action()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      return null
    } finally {
      saving.current = false
      setIsSaving(false)
    }
  }

  async function updateTemplate(
    id: number,
    request: WorkoutTemplateRequest,
  ) {
    const updated = await run(() => api.updateWorkoutTemplate(id, request))
    if (!updated) return false
    setTemplates((current) =>
      current
        .map((template) => (template.id === id ? updated : template))
        .sort((left, right) => left.name.localeCompare(right.name)),
    )
    setSuccessMessage('Template updated.')
    return true
  }

  async function createTemplate(request: WorkoutTemplateRequest) {
    const created = await run(() => api.createWorkoutTemplate(request))
    if (!created) return null
    setTemplates((current) =>
      [...current, created].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    )
    setSuccessMessage('Template created. Add exercises when you are ready.')
    return created
  }

  function replaceTemplate(updated: WorkoutTemplate) {
    setTemplates((current) =>
      current
        .map((template) => (template.id === updated.id ? updated : template))
        .sort((left, right) => left.name.localeCompare(right.name)),
    )
  }

  async function addExercise(templateId: number, exerciseId: number) {
    const updated = await run(() =>
      api.addTemplateExercise(templateId, { exerciseId }),
    )
    if (!updated) return false
    replaceTemplate(updated)
    setSuccessMessage('Exercise added to the template.')
    return true
  }

  async function moveExercise(exerciseId: number, exerciseOrder: number) {
    const updated = await run(() =>
      api.updateTemplateExercise(exerciseId, exerciseOrder),
    )
    if (!updated) return false
    replaceTemplate(updated)
    setSuccessMessage('Template exercise order updated.')
    return true
  }

  async function removeExercise(templateId: number, exerciseId: number) {
    const deleted = await run(() => api.deleteTemplateExercise(exerciseId))
    if (deleted === null) return false
    setTemplates((current) =>
      current.map((template) =>
        template.id === templateId
          ? {
              ...template,
              exercises: template.exercises.filter(
                (item) => item.id !== exerciseId,
              ),
            }
          : template,
      ),
    )
    setSuccessMessage('Exercise removed from the template.')
    return true
  }

  async function deleteTemplate(id: number) {
    const deleted = await run(() => api.deleteWorkoutTemplate(id))
    if (deleted === null) return false
    setTemplates((current) => current.filter((template) => template.id !== id))
    setSuccessMessage('Template deleted.')
    return true
  }

  async function startWorkout(
    id: number,
    request: StartTemplateWorkoutRequest,
  ): Promise<WorkoutDetail | null> {
    return run(() => api.startWorkoutFromTemplate(id, request))
  }

  return {
    templates,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    createTemplate,
    updateTemplate,
    addExercise,
    moveExercise,
    removeExercise,
    deleteTemplate,
    startWorkout,
  }
}

function getErrorMessage(error: unknown) {
  if (
    error instanceof ApiError &&
    typeof error.details === 'object' &&
    error.details !== null &&
    'message' in error.details &&
    typeof error.details.message === 'string'
  ) {
    return error.details.message
  }
  return error instanceof Error
    ? error.message
    : 'Could not update workout templates.'
}
