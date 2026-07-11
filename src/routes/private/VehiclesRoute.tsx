import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { RoleRoute } from '../guards/RoleRoute'
import { ROUTES } from '../paths'
import { canManageVehicles } from '../../utils/permissions'

const VehiclesPage = lazyPage(() =>
  import('../../pages/VehiclesPage').then((module) => ({
    default: module.VehiclesPage,
  })),
)

export const vehiclesRoute = (
  <Route
    path={ROUTES.vehicles}
    element={
      <RoleRoute allow={canManageVehicles}>
        <VehiclesPage />
      </RoleRoute>
    }
  />
)
