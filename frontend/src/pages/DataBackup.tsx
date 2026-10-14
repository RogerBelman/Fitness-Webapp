import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ApiError } from '../api/client'
import { exportDataBackup, importDataBackup } from '../api/dataBackup'
import { ActionFeedback } from '../components/ActionFeedback'
import { PageHeader } from '../components/PageHeader'

export function DataBackup() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const element = dialog.current
    if (isImportOpen) element?.showModal()
    else element?.close()
    return () => element?.close()
  }, [isImportOpen])

  async function downloadBackup() {
    setIsBusy(true)
    clearFeedback()
    try {
      const backup = await exportDataBackup()
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `workout-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setSuccessMessage('Backup downloaded.')
    } catch (error) {
      setErrorMessage(readError(error, 'Could not export your data.'))
    } finally {
      setIsBusy(false)
    }
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null)
    clearFeedback()
  }

  async function replaceData() {
    if (!selectedFile) return
    setIsImportOpen(false)
    setIsBusy(true)
    clearFeedback()
    try {
      const backup = JSON.parse(await selectedFile.text()) as unknown
      const result = await importDataBackup(backup)
      setSuccessMessage(
        `Imported ${result.workouts} workouts, ${result.exercises} exercises, ${result.templates} templates, and ${result.goals} goals.`,
      )
      setSelectedFile(null)
      if (fileInput.current) fileInput.current.value = ''
    } catch (error) {
      setErrorMessage(readError(error, 'Could not import that backup file.'))
    } finally {
      setIsBusy(false)
    }
  }

  function clearFeedback() {
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  return (
    <section className="PageStack">
      <PageHeader
        title="Data & Backup"
        description="Download a portable copy of your training data or restore a previous backup."
      />

      <ActionFeedback
        errorMessage={errorMessage}
        successMessage={successMessage}
      />

      <div className="DataBackupGrid">
        <section className="ContentBand DataBackupCard">
          <div>
            <h2>Export Data</h2>
            <p className="SectionDescription">
              Download exercises, workouts, sets, cardio entries, templates,
              and goals in one JSON file.
            </p>
          </div>
          <button
            className="Button ButtonPrimary"
            type="button"
            disabled={isBusy}
            onClick={() => void downloadBackup()}
          >
            {isBusy ? 'Working...' : 'Download Backup'}
          </button>
        </section>

        <section className="ContentBand DataBackupCard">
          <div>
            <h2>Import Data</h2>
            <p className="SectionDescription">
              Restore a backup created by this app. The file is validated
              before any current data is replaced.
            </p>
          </div>
          <label className="BackupFileField">
            Backup File
            <input
              ref={fileInput}
              accept="application/json,.json"
              disabled={isBusy}
              type="file"
              onChange={chooseFile}
            />
          </label>
          {selectedFile ? (
            <p className="SelectedBackupFile">Selected: {selectedFile.name}</p>
          ) : null}
          <button
            className="Button ButtonDanger"
            type="button"
            disabled={isBusy || !selectedFile}
            onClick={() => setIsImportOpen(true)}
          >
            Replace Current Data
          </button>
        </section>
      </div>

      <dialog
        className="ConfirmDialog"
        ref={dialog}
        aria-labelledby="import-backup-title"
        aria-describedby="import-backup-description"
        onCancel={() => setIsImportOpen(false)}
      >
        <h2 id="import-backup-title">Replace all current data?</h2>
        <p id="import-backup-description">
          This will replace every exercise, workout, template, and goal with
          the contents of {selectedFile?.name ?? 'the selected backup'}.
        </p>
        <div className="FormActions">
          <button
            autoFocus
            className="Button ButtonSecondary"
            type="button"
            onClick={() => setIsImportOpen(false)}
          >
            Cancel
          </button>
          <button
            className="Button ButtonDanger"
            type="button"
            onClick={() => void replaceData()}
          >
            Replace Data
          </button>
        </div>
      </dialog>
    </section>
  )
}

function readError(error: unknown, fallback: string) {
  if (error instanceof SyntaxError) return 'The selected file is not valid JSON.'
  if (
    error instanceof ApiError &&
    typeof error.details === 'object' &&
    error.details !== null &&
    'message' in error.details &&
    typeof error.details.message === 'string'
  ) {
    return error.details.message
  }
  return error instanceof Error && error.message ? error.message : fallback
}
