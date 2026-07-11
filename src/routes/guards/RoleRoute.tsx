import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { User } from '../../types'
import { ROUTES } from '../paths'
import { LoadingScreen } from './LoadingScreen'

interface RoleRouteProps {
  children: React.ReactNode
  allow: (user: User | null) => boolean
}

export function RoleRoute({ children, allow }: RoleRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />
  if (!allow(user)) return <Navigate to={ROUTES.home} replace />

  return children
}
