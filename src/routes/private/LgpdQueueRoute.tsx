import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { RoleRoute } from '../guards/RoleRoute'
import { ROUTES } from '../paths'
import { canAccessLgpdQueue } from '../../utils/permissions'

const LgpdQueuePage = lazyPage(() =>
  import('../../pages/lgpd/LgpdQueuePage').then((module) => ({
    default: module.LgpdQueuePage,
  })),
)

export const lgpdQueueRoute = (
  <Route
    path={ROUTES.lgpdQueue}
    element={
      <RoleRoute allow={canAccessLgpdQueue}>
        <LgpdQueuePage />
      </RoleRoute>
    }
  />
)
