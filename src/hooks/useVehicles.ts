import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createVehicle,
  deleteVehicle,
  fetchVehicles,
  updateVehicle,
} from '../api/vehicles'
import { useAuth } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import type { VehicleFormData } from '../schemas/vehicle.schema'
import { toVehiclePayload } from '../schemas/vehicle.schema'
import { mapVehicle } from '../types'
import type { Vehicle } from '../types'
import { getSafeApiErrorMessage } from '../utils/apiMessages'
import { canManageVehicles } from '../utils/permissions'

function toVehicleList(data: Awaited<ReturnType<typeof fetchVehicles>>) {
  return data.map(mapVehicle)
}

export function useVehicles() {
  const { user, isAuthenticated } = useAuth()
  const enabled = isAuthenticated && canManageVehicles(user)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.vehicles.all,
    queryFn: fetchVehicles,
    enabled,
    select: toVehicleList,
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all })
  }

  const createMutation = useMutation({
    mutationFn: async ({
      clienteId,
      data,
    }: {
      clienteId: number
      data: VehicleFormData
    }) => {
      const created = await createVehicle(toVehiclePayload(clienteId, data))
      return mapVehicle(created)
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      clienteId,
      data,
    }: {
      id: number
      clienteId: number
      data: VehicleFormData
    }) => {
      const updated = await updateVehicle(id, toVehiclePayload(clienteId, data))
      return mapVehicle(updated)
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: invalidate,
  })

  const error = query.error
    ? getSafeApiErrorMessage(query.error, 'Não foi possível carregar os veículos.')
    : null

  return {
    vehicles: query.data ?? ([] as Vehicle[]),
    isLoading: query.isLoading,
    error,
    addVehicle: (clienteId: number, data: VehicleFormData) =>
      createMutation.mutateAsync({ clienteId, data }),
    editVehicle: (id: number, clienteId: number, data: VehicleFormData) =>
      updateMutation.mutateAsync({ id, clienteId, data }),
    removeVehicle: (id: number) => deleteMutation.mutateAsync(id),
    refreshVehicles: invalidate,
    isMutating:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  }
}
