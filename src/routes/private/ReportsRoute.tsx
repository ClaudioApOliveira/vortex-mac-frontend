import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { RoleRoute } from '../guards/RoleRoute'
import { ROUTES } from '../paths'
import { canAccessOfficeReports } from '../../utils/permissions'

const OfficeReportsPage = lazyPage(() =>
  import('../../pages/serviceOrders/OfficeReportsPage').then((module) => ({
    default: module.OfficeReportsPage,
  })),
)

export const reportsRoute = (
  <Route
    path={ROUTES.reports}
    element={
      <RoleRoute allow={canAccessOfficeReports}>
        <OfficeReportsPage />
      </RoleRoute>
    }
  />
)
