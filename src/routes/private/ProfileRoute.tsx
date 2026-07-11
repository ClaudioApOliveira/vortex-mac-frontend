import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'
import { ROUTES } from '../paths'

const ProfilePage = lazyPage(() =>
  import('../../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)

export const profileRoute = <Route path={ROUTES.profile} element={<ProfilePage />} />
