import { Route } from 'react-router-dom'
import { lazyPage } from '../lazyPage'

const NotFoundPage = lazyPage(() =>
  import('../../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

export const notFoundRoute = <Route path="*" element={<NotFoundPage />} />
