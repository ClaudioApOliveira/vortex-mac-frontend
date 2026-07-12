import type { TokenResponse } from './types'

const REFRESH_BUFFER_MS = 60_000

let accessToken: string | null = null
let accessTokenExpiresAt: number | null = null

export function getAccessToken() {
  return accessToken
}

export function getAccessTokenExpiresAt() {
  return accessTokenExpiresAt
}

export function setTokensFromResponse(data: TokenResponse) {
  const now = Date.now()
  accessToken = data.accessToken
  accessTokenExpiresAt = now + data.accessTokenExpiraEmSegundos * 1000
}

export function clearTokens() {
  accessToken = null
  accessTokenExpiresAt = null
}

export function isAccessTokenExpired() {
  if (!accessTokenExpiresAt) return true
  return Date.now() >= accessTokenExpiresAt
}

export function shouldRefreshAccessToken() {
  if (!accessTokenExpiresAt) return true
  return Date.now() >= accessTokenExpiresAt - REFRESH_BUFFER_MS
}
