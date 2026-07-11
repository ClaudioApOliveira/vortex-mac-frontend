import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  primeiroAcessoRequest,
} from '../api/auth'
import { isUnauthorizedError, refreshAccessToken } from '../api/client'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasValidSession,
  shouldRefreshAccessToken,
} from '../api/tokenStorage'
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
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_CHECK_INTERVAL_MS = 30_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!hasValidSession()) {
      clearTokens()
      setUser(null)
      return
    }

    if (!getAccessToken() || shouldRefreshAccessToken()) {
      if (!getRefreshToken()) {
        clearTokens()
        setUser(null)
        return
      }

      const refreshed = await refreshAccessToken()
      if (!refreshed || !getAccessToken()) {
        clearTokens()
        setUser(null)
        return
      }
    }

    try {
      const currentUser = await fetchCurrentUser()
      setUser(mapUser(currentUser))
    } catch (error) {
      clearTokens()
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
      if (shouldRefreshAccessToken() && getRefreshToken()) {
        void refreshAccessToken()
      }
    }, TOKEN_CHECK_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password)
    const currentUser = await fetchCurrentUser()
    setUser(mapUser(currentUser))
  }, [])

  const completeFirstAccess = useCallback(
    async (email: string, senha: string, confirmarSenha: string) => {
      await primeiroAcessoRequest(email, senha, confirmarSenha)
      const currentUser = await fetchCurrentUser()
      setUser(mapUser(currentUser))
    },
    [],
  )

  const refreshUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser()
    setUser(mapUser(currentUser))
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clearTokens()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      completeFirstAccess,
      refreshUser,
      logout,
    }),
    [user, isLoading, login, completeFirstAccess, refreshUser, logout],
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
