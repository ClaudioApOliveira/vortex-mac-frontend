import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { RoleRoute } from '../guards/RoleRoute'
import { ROUTES } from '../paths'
import { canViewMyServiceOrders } from '../../utils/permissions'

const ClientServiceOrdersPage = lazyPage(() =>
  import('../../pages/ClientServiceOrdersPage').then((module) => ({
    default: module.ClientServiceOrdersPage,
  })),
)

export const myServiceOrdersRoute = (
  <Route
    path={ROUTES.myServiceOrders}
    element={
      <RoleRoute allow={canViewMyServiceOrders}>
        <ClientServiceOrdersPage />
      </RoleRoute>
    }
  />
)
