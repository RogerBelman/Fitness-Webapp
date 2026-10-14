import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DataBackup } from '../src/pages/DataBackup'

const api = vi.hoisted(() => ({
  exportDataBackup: vi.fn(),
  importDataBackup: vi.fn(),
}))

vi.mock('../src/api/dataBackup', () => api)

describe('data backup workflow', () => {
  beforeEach(() => {
    api.exportDataBackup.mockReset()
    api.importDataBackup.mockReset()
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

    render(
      <MemoryRouter>
        <DataBackup />
      </MemoryRouter>,
    )

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
})
