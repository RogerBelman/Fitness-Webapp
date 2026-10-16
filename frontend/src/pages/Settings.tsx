import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { exportDataBackup, importDataBackup } from '../api/dataBackup'
import { ActionFeedback } from '../components/ActionFeedback'
import { PageHeader } from '../components/PageHeader'
import { PasswordInput } from '../components/PasswordInput'
import { useAuth } from '../hooks/useAuth'
import { useMeasurementPreferences } from '../hooks/useMeasurementPreferences'

export function Settings() {
  const { weightUnit, setWeightUnit } = useMeasurementPreferences()
  const { changePassword, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const importDialog = useRef<HTMLDialogElement>(null)
  const deleteDialog = useRef<HTMLDialogElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useDialog(importDialog, isImportOpen)
  useDialog(deleteDialog, isDeleteOpen)

  async function submitPasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearFeedback()
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.')
      return
    }

    setBusyAction('password')
    try {
      await changePassword({ currentPassword, newPassword })
      navigate('/login', {
        replace: true,
        state: { notice: 'Password changed. Sign in with your new password.' },
      })
    } catch (error) {
      setErrorMessage(readError(error, 'Could not change your password.'))
    } finally {
      setBusyAction(null)
    }
  }

  async function downloadBackup() {
    setBusyAction('export')
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
      setBusyAction(null)
    }
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null)
    clearFeedback()
  }

  async function replaceData() {
    if (!selectedFile) return
    setIsImportOpen(false)
    setBusyAction('import')
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
      setBusyAction(null)
    }
  }

  async function confirmAccountDeletion() {
    setIsDeleteOpen(false)
    setBusyAction('delete')
    clearFeedback()
    try {
      await deleteAccount({ currentPassword: deletePassword })
      navigate('/login', {
        replace: true,
        state: { notice: 'Your account and workout data were deleted.' },
      })
    } catch (error) {
      setDeletePassword('')
      setErrorMessage(readError(error, 'Could not delete your account.'))
    } finally {
      setBusyAction(null)
    }
  }

  function clearFeedback() {
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  async function changeWeightUnit(unit: 'lb' | 'kg') {
    if (unit === weightUnit) return
    setBusyAction('preferences')
    clearFeedback()
    try {
      await setWeightUnit(unit)
      setSuccessMessage(`Weight units changed to ${unit}.`)
    } catch (error) {
      setErrorMessage(readError(error, 'Could not update weight units.'))
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section className="PageStack">
      <PageHeader
        title="Settings"
        description="Manage your preferences, password, workout data, and account."
      />

      <ActionFeedback
        errorMessage={errorMessage}
        successMessage={successMessage}
      />

      <div className="SettingsGrid">
        <section className="ContentBand SettingsCard" aria-labelledby="preferences-heading">
          <div>
            <p className="SectionEyebrow">Preferences</p>
            <h2 id="preferences-heading">Measurements</h2>
            <p className="SectionDescription">
              Choose the unit used to display and enter strength-training weight.
            </p>
          </div>
          <div className="SettingRow">
            <div>
              <strong>Weight units</strong>
              <span>Saved to your account.</span>
            </div>
            <div className="WeightUnitControl" role="group" aria-label="Weight unit">
              <div className="WeightUnitToggle">
                {(['lb', 'kg'] as const).map((unit) => (
                  <button
                    aria-pressed={weightUnit === unit}
                    className={weightUnit === unit ? 'WeightUnitOption active' : 'WeightUnitOption'}
                    disabled={busyAction !== null}
                    key={unit}
                    onClick={() => void changeWeightUnit(unit)}
                    type="button"
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ContentBand SettingsCard" aria-labelledby="security-heading">
          <div>
            <p className="SectionEyebrow">Security</p>
            <h2 id="security-heading">Password</h2>
            <p className="SectionDescription">
              Change your account password. You will be signed out afterward.
            </p>
          </div>
          <form className="SettingsForm" onSubmit={(event) => void submitPasswordChange(event)}>
            <div className="SettingsField">
              <label htmlFor="current-password">Current Password</label>
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                maxLength={72}
                required
                toggleLabel="current password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="SettingsField">
              <label htmlFor="new-password">New Password</label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                maxLength={72}
                minLength={8}
                required
                toggleLabel="new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <span className="FieldHint">Use at least 8 characters.</span>
            </div>
            <div className="SettingsField">
              <label htmlFor="confirm-new-password">Confirm New Password</label>
              <PasswordInput
                id="confirm-new-password"
                autoComplete="new-password"
                maxLength={72}
                minLength={8}
                required
                toggleLabel="new password confirmation"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            <button
              className="Button ButtonPrimary"
              disabled={busyAction !== null}
              type="submit"
            >
              {busyAction === 'password' ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </section>
      </div>

      <section className="ContentBand SettingsSection" aria-labelledby="data-heading">
        <div>
          <p className="SectionEyebrow">Your Data</p>
          <h2 id="data-heading">Backup and Restore</h2>
          <p className="SectionDescription">
            Download a portable copy of your training data or restore a previous backup.
          </p>
        </div>
        <div className="DataBackupGrid">
          <article className="SettingsInsetCard">
            <div>
              <h3>Export Data</h3>
              <p>Download your exercises, workouts, sets, cardio entries, templates, and goals.</p>
            </div>
            <button
              className="Button ButtonPrimary"
              disabled={busyAction !== null}
              type="button"
              onClick={() => void downloadBackup()}
            >
              {busyAction === 'export' ? 'Downloading...' : 'Download Backup'}
            </button>
          </article>

          <article className="SettingsInsetCard">
            <div>
              <h3>Import Data</h3>
              <p>Restore a backup after it is validated. Your current training data will be replaced.</p>
            </div>
            <label className="BackupFileField">
              Backup File
              <input
                ref={fileInput}
                accept="application/json,.json"
                disabled={busyAction !== null}
                type="file"
                onChange={chooseFile}
              />
            </label>
            {selectedFile ? (
              <p className="SelectedBackupFile">Selected: {selectedFile.name}</p>
            ) : null}
            <button
              className="Button ButtonDanger"
              disabled={busyAction !== null || !selectedFile}
              type="button"
              onClick={() => setIsImportOpen(true)}
            >
              {busyAction === 'import' ? 'Importing...' : 'Replace Current Data'}
            </button>
          </article>
        </div>
      </section>

      <section className="ContentBand DangerZone" aria-labelledby="delete-account-heading">
        <div>
          <p className="SectionEyebrow">Account</p>
          <h2 id="delete-account-heading">Delete Account</h2>
          <p className="SectionDescription">
            Permanently delete your account and all of its workout data. Download a backup first if you may need it later.
          </p>
        </div>
        <button
          className="Button ButtonDanger"
          disabled={busyAction !== null}
          type="button"
          onClick={() => {
            clearFeedback()
            setIsDeleteOpen(true)
          }}
        >
          {busyAction === 'delete' ? 'Deleting...' : 'Delete Account'}
        </button>
      </section>

      <dialog
        className="ConfirmDialog"
        ref={importDialog}
        aria-labelledby="import-backup-title"
        aria-describedby="import-backup-description"
        onCancel={() => setIsImportOpen(false)}
      >
        <h2 id="import-backup-title">Replace all current data?</h2>
        <p id="import-backup-description">
          This will replace every exercise, workout, template, and goal with the contents of {selectedFile?.name ?? 'the selected backup'}.
        </p>
        <div className="FormActions">
          <button autoFocus className="Button ButtonSecondary" type="button" onClick={() => setIsImportOpen(false)}>
            Cancel
          </button>
          <button className="Button ButtonDanger" type="button" onClick={() => void replaceData()}>
            Replace Data
          </button>
        </div>
      </dialog>

      <dialog
        className="ConfirmDialog"
        ref={deleteDialog}
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
        onCancel={() => setIsDeleteOpen(false)}
      >
        <h2 id="delete-account-title">Permanently delete your account?</h2>
        <p id="delete-account-description">
          This deletes your exercises, workouts, templates, goals, and account. This action cannot be undone.
        </p>
        <div className="DialogPasswordField">
          <label htmlFor="delete-account-password">Current Password</label>
          <PasswordInput
            id="delete-account-password"
            autoComplete="current-password"
            maxLength={72}
            required
            toggleLabel="account deletion password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
          />
        </div>
        <div className="FormActions">
          <button
            autoFocus
            className="Button ButtonSecondary"
            type="button"
            onClick={() => {
              setDeletePassword('')
              setIsDeleteOpen(false)
            }}
          >
            Cancel
          </button>
          <button
            className="Button ButtonDanger"
            disabled={!deletePassword}
            type="button"
            onClick={() => void confirmAccountDeletion()}
          >
            Delete My Account
          </button>
        </div>
      </dialog>
    </section>
  )
}

function useDialog(
  dialog: RefObject<HTMLDialogElement | null>,
  isOpen: boolean,
) {
  useEffect(() => {
    const element = dialog.current
    if (isOpen) element?.showModal()
    else element?.close()
    return () => element?.close()
  }, [dialog, isOpen])
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
