import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { RoleRoute } from '../guards/RoleRoute'
import { ROUTES } from '../paths'
import { canManageCustomers } from '../../utils/permissions'

const CustomersPage = lazyPage(() =>
  import('../../pages/CustomersPage').then((module) => ({
    default: module.CustomersPage,
  })),
)

export const customersRoute = (
  <Route
    path={ROUTES.customers}
    element={
      <RoleRoute allow={canManageCustomers}>
        <CustomersPage />
      </RoleRoute>
    }
  />
)
