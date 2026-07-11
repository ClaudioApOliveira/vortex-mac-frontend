import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { PublicRoute } from '../guards/PublicRoute'
import { ROUTES } from '../paths'

const LoginPage = lazyPage(() =>
  import('../../pages/LoginPage').then((module) => ({ default: module.LoginPage })),
)

export const publicRoute = (
  <Route
    path={ROUTES.login}
    element={
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    }
  />
)
