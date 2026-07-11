import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { RoleRoute } from '../guards/RoleRoute'
import { ROUTES } from '../paths'
import { canManageUsers } from '../../utils/permissions'

const UsersPage = lazyPage(() =>
  import('../../pages/UsersPage').then((module) => ({ default: module.UsersPage })),
)

export const usersRoute = (
  <Route
    path={ROUTES.users}
    element={
      <RoleRoute allow={canManageUsers}>
        <UsersPage />
      </RoleRoute>
    }
  />
)
