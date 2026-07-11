import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createVehicle,
  deleteVehicle,
  fetchVehicles,
  updateVehicle,
} from '../api/vehicles'
import type { VehicleFormData } from '../schemas/vehicle.schema'
import { toVehiclePayload } from '../schemas/vehicle.schema'
import { mapVehicle } from '../types'
import type { Vehicle } from '../types'
import { canManageVehicles } from '../utils/permissions'
import { useAuth } from './AuthContext'

interface VehicleContextValue {
  vehicles: Vehicle[]
  isLoading: boolean
  error: string | null
  addVehicle: (clienteId: number, data: VehicleFormData) => Promise<Vehicle>
  editVehicle: (id: number, clienteId: number, data: VehicleFormData) => Promise<Vehicle>
  removeVehicle: (id: number) => Promise<void>
  refreshVehicles: () => Promise<void>
}

const VehicleContext = createContext<VehicleContextValue | null>(null)

function toVehicleRequest(clienteId: number, data: VehicleFormData) {
  return toVehiclePayload(clienteId, data)
}

export function VehicleProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshVehicles = useCallback(async () => {
    if (!canManageVehicles(user)) {
      setVehicles([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchVehicles()
      setVehicles(response.map(mapVehicle))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível carregar os veículos.'
      setError(message)
      setVehicles([])
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthenticated && canManageVehicles(user)) {
      void refreshVehicles()
      return
    }

    setVehicles([])
    setError(null)
  }, [isAuthenticated, user, refreshVehicles])

  const addVehicle = useCallback(async (clienteId: number, data: VehicleFormData) => {
    const created = await createVehicle(toVehicleRequest(clienteId, data))
    const vehicle = mapVehicle(created)
    setVehicles((prev) => [vehicle, ...prev])
    return vehicle
  }, [])

  const editVehicle = useCallback(
    async (id: number, clienteId: number, data: VehicleFormData) => {
      const updated = await updateVehicle(id, toVehicleRequest(clienteId, data))
      const vehicle = mapVehicle(updated)
      setVehicles((prev) => prev.map((item) => (item.id === id ? vehicle : item)))
      return vehicle
    },
    [],
  )

  const removeVehicle = useCallback(async (id: number) => {
    await deleteVehicle(id)
    setVehicles((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      vehicles,
      isLoading,
      error,
      addVehicle,
      editVehicle,
      removeVehicle,
      refreshVehicles,
    }),
    [vehicles, isLoading, error, addVehicle, editVehicle, removeVehicle, refreshVehicles],
  )

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>
}

export function useVehicles() {
  const context = useContext(VehicleContext)
  if (!context) {
    throw new Error('useVehicles deve ser usado dentro de VehicleProvider')
  }
  return context
}
