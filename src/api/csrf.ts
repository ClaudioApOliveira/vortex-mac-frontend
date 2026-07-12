export const CSRF_COOKIE_NAME = 'csrf_token'
export const CSRF_HEADER_NAME = 'X-CSRF-Token'

const CSRF_PROTECTED_ROUTES = new Set(['/api/auth/refresh', '/api/auth/logout'])

export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`),
  )

  return match ? decodeURIComponent(match[1]) : null
}

export function applyCsrfHeader(headers: Headers) {
  const token = getCsrfTokenFromCookie()
  if (token) {
    headers.set(CSRF_HEADER_NAME, token)
  }
}

export function requiresCsrfHeader(path: string, method = 'GET') {
  return method.toUpperCase() === 'POST' && CSRF_PROTECTED_ROUTES.has(path)
}
