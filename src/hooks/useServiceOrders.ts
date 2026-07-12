import {
  createServiceOrder,
  deleteServiceOrder,
  fetchServiceOrdersPage,
  updateServiceOrder,
} from '../api/serviceOrders'
import type { ServiceOrderFormData } from '../schemas/serviceOrder.schema'
import { toServiceOrderPayload } from '../schemas/serviceOrder.schema'
import { mapServiceOrder } from '../types'
import type { ServiceOrder } from '../types'
import { canManageServiceOrders } from '../utils/permissions'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import { usePaginatedQuery } from './usePaginatedQuery'

export function useServiceOrdersList(page: number, pageSize: number) {
  const { user, isAuthenticated } = useAuth()
  const enabled = isAuthenticated && canManageServiceOrders(user)

  return usePaginatedQuery({
    queryKey: queryKeys.serviceOrders.all,
    queryFn: fetchServiceOrdersPage,
    page,
    pageSize,
    enabled,
    live: true,
  })
}

export function useServiceOrdersSummary(pageSize = 5) {
  const query = useServiceOrdersList(0, pageSize)

  return {
    serviceOrders: query.items.map(mapServiceOrder),
    totalElements: query.totalElements,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  }
}

export function useServiceOrderMutations() {
  const queryClient = useQueryClient()

  const invalidateLists = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.serviceOrders.all })
  }

  const createMutation = useMutation({
    mutationFn: async (data: ServiceOrderFormData) => {
      const created = await createServiceOrder(toServiceOrderPayload(data))
      return mapServiceOrder(created)
    },
    onSuccess: invalidateLists,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ServiceOrderFormData }) => {
      const updated = await updateServiceOrder(id, toServiceOrderPayload(data))
      return mapServiceOrder(updated)
    },
    onSuccess: invalidateLists,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteServiceOrder(id)
      return id
    },
    onSuccess: invalidateLists,
  })

  return {
    addServiceOrder: (data: ServiceOrderFormData) => createMutation.mutateAsync(data),
    editServiceOrder: (id: number, data: ServiceOrderFormData) =>
      updateMutation.mutateAsync({ id, data }),
    removeServiceOrder: (id: number) => deleteMutation.mutateAsync(id),
    isMutating:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  }
}

export function mapServiceOrdersPageItems(items: ReturnType<typeof useServiceOrdersList>['items']) {
  return items.map(mapServiceOrder) as ServiceOrder[]
}
