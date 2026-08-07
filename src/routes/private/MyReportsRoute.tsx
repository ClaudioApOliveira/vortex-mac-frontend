import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { RoleRoute } from '../guards/RoleRoute'
import { ROUTES } from '../paths'
import { canViewMyServiceOrders } from '../../utils/permissions'

const ClientReportsPage = lazyPage(() =>
  import('../../pages/serviceOrders/ClientReportsPage').then((module) => ({
    default: module.ClientReportsPage,
  })),
)

export const myReportsRoute = (
  <Route
    path={ROUTES.myReports}
    element={
      <RoleRoute allow={canViewMyServiceOrders}>
        <ClientReportsPage />
      </RoleRoute>
    }
  />
)
