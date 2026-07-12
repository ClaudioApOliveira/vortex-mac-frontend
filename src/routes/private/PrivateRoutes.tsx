import { Route } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { ProtectedRoute } from '../guards/ProtectedRoute'
import { customersRoute } from './CustomersRoute'
import { homeRoute } from './HomeRoute'
import { myServiceOrdersRoute } from './MyServiceOrdersRoute'
import { notFoundRoute } from './NotFoundRoute'
import { profileRoute } from './ProfileRoute'
import { serviceOrdersRoute } from './ServiceOrdersRoute'
import { usersRoute } from './UsersRoute'
import { vehiclesRoute } from './VehiclesRoute'

export const privateRoutes = (
  <Route
    element={
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    }
  >
    {homeRoute}
    {profileRoute}
    {myServiceOrdersRoute}
    {customersRoute}
    {vehiclesRoute}
    {serviceOrdersRoute}
    {usersRoute}
    {notFoundRoute}
  </Route>
)
