import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { ROUTES } from '../paths'

const HomePage = lazyPage(() =>
  import('../../pages/HomePage').then((module) => ({ default: module.HomePage })),
)

export const homeRoute = <Route path={ROUTES.home} element={<HomePage />} />
