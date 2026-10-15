import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, resetCsrfToken } from '../src/api/client'

describe('API client session security', () => {
  beforeEach(() => {
    resetCsrfToken()
    vi.restoreAllMocks()
  })

  it('includes credentials and a CSRF token on write requests', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        headerName: 'X-CSRF-TOKEN',
        token: 'test-csrf-token',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }))
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/api/exercises', {
      method: 'POST',
      body: { name: 'Bench Press' },
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/auth/csrf')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'include' })

    const writeOptions = fetchMock.mock.calls[1][1] as RequestInit
    expect(writeOptions.credentials).toBe('include')
    expect(new Headers(writeOptions.headers).get('X-CSRF-TOKEN')).toBe('test-csrf-token')
  })
})
