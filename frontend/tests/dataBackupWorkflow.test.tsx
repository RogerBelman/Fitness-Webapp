import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Settings } from '../src/pages/Settings'
import { MeasurementPreferencesProvider } from '../src/contexts/MeasurementPreferences'

const api = vi.hoisted(() => ({
  exportDataBackup: vi.fn(),
  importDataBackup: vi.fn(),
}))

const account = vi.hoisted(() => ({
  updatePreferences: vi.fn(),
  changeEmail: vi.fn(),
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
}))

vi.mock('../src/api/dataBackup', () => api)
vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'settings_user', email: 'settings@example.com', weightUnit: 'lb', createdAt: '2026-10-14T00:00:00Z' },
    updatePreferences: account.updatePreferences,
    changeEmail: account.changeEmail,
    changePassword: account.changePassword,
    deleteAccount: account.deleteAccount,
  }),
}))

describe('data backup workflow', () => {
  beforeEach(() => {
    api.exportDataBackup.mockReset()
    api.importDataBackup.mockReset()
    account.updatePreferences.mockReset()
    account.changeEmail.mockReset()
    account.changePassword.mockReset()
    account.deleteAccount.mockReset()
  })

  it('requires confirmation before replacing data from a selected backup', async () => {
    const user = userEvent.setup()
    const backup = {
      version: 1,
      exportedAt: '2026-10-14T00:00:00Z',
      exercises: [],
      workouts: [],
      templates: [],
      goals: [],
    }
    api.importDataBackup.mockResolvedValue({
      exercises: 0,
      workouts: 0,
      templates: 0,
      goals: 0,
    })

    renderSettings()

    const file = new File([JSON.stringify(backup)], 'training-backup.json', {
      type: 'application/json',
    })
    await user.upload(screen.getByLabelText('Backup File'), file)
    await user.click(
      screen.getByRole('button', { name: 'Replace Current Data' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Replace all current data?' }),
    ).toBeInTheDocument()
    expect(api.importDataBackup).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Replace Data' }))

    await waitFor(() => expect(api.importDataBackup).toHaveBeenCalledWith(backup))
    expect(
      await screen.findByText(
        'Imported 0 workouts, 0 exercises, 0 templates, and 0 goals.',
      ),
    ).toBeInTheDocument()
  })

  it('validates and submits a password change', async () => {
    const user = userEvent.setup()
    account.changePassword.mockResolvedValue(undefined)
    renderSettings()

    const security = screen.getByRole('region', { name: 'Password' })
    await user.type(within(security).getByLabelText('Current Password'), 'current-password')
    await user.type(within(security).getByLabelText(/^New Password/), 'updated-password')
    await user.type(within(security).getByLabelText('Confirm New Password'), 'updated-password')
    await user.click(within(security).getByRole('button', { name: 'Change Password' }))

    await waitFor(() => expect(account.changePassword).toHaveBeenCalledWith({
      currentPassword: 'current-password',
      newPassword: 'updated-password',
    }))
  })

  it('confirms the current password before changing the recovery email', async () => {
    const user = userEvent.setup()
    account.changeEmail.mockResolvedValue(undefined)
    renderSettings()

    const recovery = screen.getByRole('region', { name: 'Recovery Email' })
    const email = within(recovery).getByLabelText('Email')
    await user.clear(email)
    await user.type(email, 'updated@example.com')
    await user.type(within(recovery).getByLabelText('Current Password'), 'current-password')
    await user.click(within(recovery).getByRole('button', { name: 'Save Recovery Email' }))

    await waitFor(() => expect(account.changeEmail).toHaveBeenCalledWith({
      email: 'updated@example.com',
      currentPassword: 'current-password',
    }))
  })

  it('requires password confirmation before deleting the account', async () => {
    const user = userEvent.setup()
    account.deleteAccount.mockResolvedValue(undefined)
    renderSettings()

    await user.click(screen.getByRole('button', { name: 'Delete Account' }))
    expect(screen.getByRole('heading', { name: 'Permanently delete your account?' })).toBeInTheDocument()
    expect(account.deleteAccount).not.toHaveBeenCalled()

    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Current Password'), 'current-password')
    await user.click(within(dialog).getByRole('button', { name: 'Delete My Account' }))

    await waitFor(() => expect(account.deleteAccount).toHaveBeenCalledWith({
      currentPassword: 'current-password',
    }))
  })
})

function renderSettings() {
  return render(
    <MemoryRouter>
      <MeasurementPreferencesProvider>
        <Settings />
      </MeasurementPreferencesProvider>
    </MemoryRouter>,
  )
}
