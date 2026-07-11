import type { TokenResponse } from './types'

const ACCESS_TOKEN_KEY = 'vortex-mec-access-token'
const REFRESH_TOKEN_KEY = 'vortex-mec-refresh-token'
const ACCESS_EXPIRES_AT_KEY = 'vortex-mec-access-expires-at'
const REFRESH_EXPIRES_AT_KEY = 'vortex-mec-refresh-expires-at'

const REFRESH_BUFFER_MS = 60_000

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getAccessTokenExpiresAt() {
  const value = sessionStorage.getItem(ACCESS_EXPIRES_AT_KEY)
  return value ? Number(value) : null
}

export function getRefreshTokenExpiresAt() {
  const value = sessionStorage.getItem(REFRESH_EXPIRES_AT_KEY)
  return value ? Number(value) : null
}

export function setTokensFromResponse(data: TokenResponse) {
  const now = Date.now()
  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
  sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
  sessionStorage.setItem(
    ACCESS_EXPIRES_AT_KEY,
    String(now + data.accessTokenExpiraEmSegundos * 1000),
  )
  sessionStorage.setItem(
    REFRESH_EXPIRES_AT_KEY,
    String(now + data.refreshTokenExpiraEmSegundos * 1000),
  )
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_EXPIRES_AT_KEY)
  sessionStorage.removeItem(REFRESH_EXPIRES_AT_KEY)
}

export function isAccessTokenExpired() {
  const expiresAt = getAccessTokenExpiresAt()
  if (!expiresAt) return true
  return Date.now() >= expiresAt
}

export function shouldRefreshAccessToken() {
  const expiresAt = getAccessTokenExpiresAt()
  if (!expiresAt) return true
  return Date.now() >= expiresAt - REFRESH_BUFFER_MS
}

export function isRefreshTokenExpired() {
  const expiresAt = getRefreshTokenExpiresAt()
  if (!expiresAt) return true
  return Date.now() >= expiresAt
}

export function hasValidSession() {
  if (getAccessToken() && !isAccessTokenExpired()) return true
  if (getRefreshToken() && !isRefreshTokenExpired()) return true
  return false
}
