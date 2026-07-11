import type { ApiErrorBody, ApiEnvelope } from './types'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    'data' in value
  )
}

export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody
    const message =
      body.errors?.length ? body.errors.join('; ') : body.message
    return new ApiError(response.status, message || 'Erro inesperado. Tente novamente.')
  } catch {
    return new ApiError(response.status, 'Erro inesperado. Tente novamente.')
  }
}

export async function parseApiData<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const body: unknown = await response.json()

  if (isApiEnvelope<T>(body)) {
    return body.data as T
  }

  return body as T
}
