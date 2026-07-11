import { lazy, Suspense, type ComponentType } from 'react'
import { LoadingScreen } from './guards/LoadingScreen'

export function lazyPage(loader: () => Promise<{ default: ComponentType }>) {
  const LazyComponent = lazy(loader)

  return function LazyPage() {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LazyComponent />
      </Suspense>
    )
  }
}
