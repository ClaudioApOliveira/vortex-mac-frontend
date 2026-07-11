import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { RoleRoute } from '../guards/RoleRoute'
import { ROUTES } from '../paths'
import { canManageServiceOrders } from '../../utils/permissions'

const ServiceOrdersPage = lazyPage(() =>
  import('../../pages/ServiceOrdersPage').then((module) => ({
    default: module.ServiceOrdersPage,
  })),
)

export const serviceOrdersRoute = (
  <Route
    path={ROUTES.serviceOrders}
    element={
      <RoleRoute allow={canManageServiceOrders}>
        <ServiceOrdersPage />
      </RoleRoute>
    }
  />
)
