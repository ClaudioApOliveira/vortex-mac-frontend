import { Route } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { ProtectedRoute } from '../guards/ProtectedRoute'
import { customersRoute } from './CustomersRoute'
import { homeRoute } from './HomeRoute'
import { lgpdQueueRoute } from './LgpdQueueRoute'
import { myReportsRoute } from './MyReportsRoute'
import { myServiceOrdersRoute } from './MyServiceOrdersRoute'
import { notFoundRoute } from './NotFoundRoute'
import { profileRoute } from './ProfileRoute'
import { reportsRoute } from './ReportsRoute'
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
    {myReportsRoute}
    {customersRoute}
    {lgpdQueueRoute}
    {vehiclesRoute}
    {serviceOrdersRoute}
    {reportsRoute}
    {usersRoute}
    {notFoundRoute}
  </Route>
)
