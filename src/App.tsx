import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { LiquidBackground } from './components/ui/LiquidBackground'
import { AuthProvider } from './contexts/AuthContext'
import { CustomerProvider } from './contexts/CustomerContext'
import { VehicleProvider } from './contexts/VehicleContext'
import { queryClient } from './lib/queryClient'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LiquidBackground />
        <AuthProvider>
          <CustomerProvider>
            <VehicleProvider>
              <AppRoutes />
            </VehicleProvider>
          </CustomerProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
