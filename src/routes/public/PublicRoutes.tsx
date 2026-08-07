import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { PublicRoute } from '../guards/PublicRoute'
import { ROUTES } from '../paths'

const LoginPage = lazyPage(() =>
  import('../../pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
)

const PrivacyPolicyPage = lazyPage(() =>
  import('../../pages/auth/PrivacyPolicyPage').then((module) => ({
    default: module.PrivacyPolicyPage,
  })),
)

export const publicRoute = (
  <>
    <Route
      path={ROUTES.login}
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route path={ROUTES.privacy} element={<PrivacyPolicyPage />} />
  </>
)
