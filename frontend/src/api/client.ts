const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
export const AUTH_REQUIRED_EVENT = 'workout-tracker:auth-required'

type CsrfToken = {
  headerName: string
  token: string
}

let csrfTokenPromise: Promise<CsrfToken> | null = null

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(status: number, message: string, details: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let response = await sendRequest(path, options)

  if (response.status === 403 && requiresCsrf(options.method)) {
    resetCsrfToken()
    response = await sendRequest(path, options)
  }

  if (!response.ok) {
    if (response.status === 401) {
      resetCsrfToken()
      window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT))
    }
    const details = await readJson(response)
    throw new ApiError(response.status, response.statusText, details)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function resetCsrfToken() {
  csrfTokenPromise = null
}

async function sendRequest(path: string, options: RequestOptions) {
  const headers = new Headers(options.headers)

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (requiresCsrf(options.method)) {
    const csrf = await getCsrfToken()
    headers.set(csrf.headerName, csrf.token)
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: options.credentials ?? 'include',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
}

function requiresCsrf(method: string | undefined) {
  return !['GET', 'HEAD', 'OPTIONS'].includes((method ?? 'GET').toUpperCase())
}

function getCsrfToken() {
  csrfTokenPromise ??= fetch(`${API_BASE_URL}/api/auth/csrf`, {
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        const details = await readJson(response)
        throw new ApiError(response.status, response.statusText, details)
      }
      return response.json() as Promise<CsrfToken>
    })
    .catch((error: unknown) => {
      csrfTokenPromise = null
      throw error
    })
  return csrfTokenPromise
}

async function readJson(response: Response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}
