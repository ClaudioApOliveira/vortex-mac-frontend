import { Routes } from 'react-router-dom'
import { privateRoutes } from './private/PrivateRoutes'
import { publicRoute } from './public/PublicRoutes'

export function AppRoutes() {
  return (
    <Routes>
      {publicRoute}
      {privateRoutes}
    </Routes>
  )
}
