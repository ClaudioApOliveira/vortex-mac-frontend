import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  primeiroAcessoRequest,
} from '../api/auth'
import {
  isUnauthorizedError,
  refreshAccessToken,
  resetSessionExpiredGuard,
  setSessionExpiredHandler,
} from '../api/client'
import {
  clearTokens,
  getAccessToken,
  shouldRefreshAccessToken,
} from '../api/tokenStorage'
import type { UserResponse } from '../api/types'
import { queryClient } from '../lib/queryClient'
import { ROUTES } from '../routes/paths'
import { mapUser } from '../types'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  completeFirstAccess: (
    email: string,
    senha: string,
    confirmarSenha: string,
  ) => Promise<void>
  syncUser: (response: UserResponse) => void
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_CHECK_INTERVAL_MS = 30_000

function clearSessionState() {
  clearTokens()
  queryClient.clear()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleSessionExpired = useCallback(() => {
    clearSessionState()
    setUser(null)
    navigate(ROUTES.login, { replace: true })
  }, [navigate])

  useEffect(() => {
    setSessionExpiredHandler(handleSessionExpired)
    return () => setSessionExpiredHandler(null)
  }, [handleSessionExpired])

  const loadUser = useCallback(async () => {
    if (!getAccessToken() || shouldRefreshAccessToken()) {
      const refreshed = await refreshAccessToken({ notifyOnFailure: false })
      if (!refreshed || !getAccessToken()) {
        clearSessionState()
        setUser(null)
        return
      }
    }

    try {
      const currentUser = await fetchCurrentUser()
      setUser(mapUser(currentUser))
      resetSessionExpiredGuard()
    } catch (error) {
      clearSessionState()
      setUser(null)
      if (!isUnauthorizedError(error)) {
        console.error('Falha ao carregar usuário autenticado', error)
      }
    }
  }, [])

  useEffect(() => {
    loadUser().finally(() => setIsLoading(false))
  }, [loadUser])

  useEffect(() => {
    if (!user) return

    const intervalId = window.setInterval(() => {
      if (shouldRefreshAccessToken()) {
        void refreshAccessToken()
      }
    }, TOKEN_CHECK_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password)
    const currentUser = await fetchCurrentUser()
    setUser(mapUser(currentUser))
    resetSessionExpiredGuard()
  }, [])

  const completeFirstAccess = useCallback(
    async (email: string, senha: string, confirmarSenha: string) => {
      await primeiroAcessoRequest(email, senha, confirmarSenha)
      const currentUser = await fetchCurrentUser()
      setUser(mapUser(currentUser))
      resetSessionExpiredGuard()
    },
    [],
  )

  const syncUser = useCallback((response: UserResponse) => {
    setUser(mapUser(response))
  }, [])

  const refreshUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser()
    setUser(mapUser(currentUser))
    resetSessionExpiredGuard()
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clearSessionState()
      setUser(null)
      resetSessionExpiredGuard()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      completeFirstAccess,
      syncUser,
      refreshUser,
      logout,
    }),
    [user, isLoading, login, completeFirstAccess, syncUser, refreshUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
