import { apiRequest } from './client'
import type { DataBackup, DataImportResponse } from '../types/dataBackup'

export function exportDataBackup() {
  return apiRequest<DataBackup>('/api/data-backup')
}

export function importDataBackup(backup: unknown) {
  return apiRequest<DataImportResponse>('/api/data-backup', {
    method: 'PUT',
    body: backup,
  })
}
