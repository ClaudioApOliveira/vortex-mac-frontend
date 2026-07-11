import { API_BASE_URL } from '../config/api'
import { ApiError, parseApiData, parseApiError } from './errors'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isRefreshTokenExpired,
  setTokensFromResponse,
  shouldRefreshAccessToken,
} from './tokenStorage'
import type { TokenResponse } from './types'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  auth?: boolean
}

let refreshPromise: Promise<boolean> | null = null

async function parseRefreshResponse(response: Response): Promise<TokenResponse> {
  const data = await parseApiData<TokenResponse>(response)
  if (!data?.accessToken || !data?.refreshToken) {
    throw new ApiError(401, 'Resposta de autenticação inválida.')
  }
  return data
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken || isRefreshTokenExpired()) {
    clearTokens()
    return false
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    clearTokens()
    return false
  }

  try {
    const data = await parseRefreshResponse(response)
    setTokensFromResponse(data)
    return true
  } catch {
    clearTokens()
    return false
  }
}

async function ensureRefreshed(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function ensureValidAccessToken() {
  if (!getAccessToken()) {
    if (getRefreshToken()) {
      return ensureRefreshed()
    }
    return false
  }

  if (shouldRefreshAccessToken()) {
    return ensureRefreshed()
  }

  return true
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers, ...rest } = options

  if (auth) {
    const hasToken = await ensureValidAccessToken()
    const accessToken = getAccessToken()

    if (!hasToken || !accessToken) {
      throw new ApiError(401, 'Não autenticado.')
    }
  }

  const requestHeaders = new Headers(headers)
  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getAccessToken()
    if (!token) {
      throw new ApiError(401, 'Não autenticado.')
    }
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const execute = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

  let response = await execute()

  if (response.status === 401 && auth && getRefreshToken()) {
    const refreshed = await ensureRefreshed()
    if (refreshed) {
      const token = getAccessToken()
      if (token) {
        requestHeaders.set('Authorization', `Bearer ${token}`)
      }
      response = await execute()
    }
  }

  if (!response.ok) {
    throw await parseApiError(response)
  }

  return parseApiData<T>(response)
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401
}

export function isForbiddenError(error: unknown) {
  return error instanceof ApiError && error.status === 403
}
