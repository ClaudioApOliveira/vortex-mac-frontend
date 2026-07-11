import { Navigate, Route, Routes } from 'react-router-dom'
import { privateRoutes } from './private/PrivateRoutes'
import { publicRoute } from './public/PublicRoutes'
import { ROUTES } from './paths'

export function AppRoutes() {
  return (
    <Routes>
      {publicRoute}
      {privateRoutes}
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  )
}
