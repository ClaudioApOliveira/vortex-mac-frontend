import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROUTES } from '../paths'
import { LoadingScreen } from './LoadingScreen'

interface PublicRouteProps {
  children: React.ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to={ROUTES.home} replace />

  return children
}
