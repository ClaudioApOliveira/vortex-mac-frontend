import { useMemo } from 'react'
import {
  createServiceOrder,
  deleteServiceOrder,
  fetchServiceOrdersPage,
  updateServiceOrder,
  updateServiceOrderStatus,
  type ServiceOrderListFilters,
} from '../api/serviceOrders'
import type { ServiceOrderStatus } from '../api/types'
import { emptyArray } from '../constants/empty'
import type { ServiceOrderFormData } from '../schemas/serviceOrder.schema'
import { toServiceOrderPayload } from '../schemas/serviceOrder.schema'
import { mapServiceOrder } from '../types'
import type { ServiceOrder } from '../types'
import { canManageServiceOrders } from '../utils/permissions'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import { usePaginatedQuery } from './usePaginatedQuery'

export type { ServiceOrderListFilters }

export function useServiceOrdersList(
  page: number,
  pageSize: number,
  filters: ServiceOrderListFilters = {},
) {
  const { user, isAuthenticated } = useAuth()
  const enabled = isAuthenticated && canManageServiceOrders(user)

  return usePaginatedQuery({
    queryKey: [...queryKeys.serviceOrders.all, filters],
    queryFn: (p, size) => fetchServiceOrdersPage(p, size, filters),
    page,
    pageSize,
    enabled,
    live: true,
  })
}

export function useServiceOrdersSummary(pageSize = 5) {
  const query = useServiceOrdersList(0, pageSize)

  const serviceOrders = useMemo(
    () => query.items.map(mapServiceOrder),
    [query.items],
  )

  return {
    serviceOrders,
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

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      observacao,
    }: {
      id: number
      status: ServiceOrderStatus
      observacao?: string
    }) => {
      const updated = await updateServiceOrderStatus(id, status, observacao)
      return mapServiceOrder(updated)
    },
    onSuccess: invalidateLists,
  })

  return {
    addServiceOrder: (data: ServiceOrderFormData) => createMutation.mutateAsync(data),
    editServiceOrder: (id: number, data: ServiceOrderFormData) =>
      updateMutation.mutateAsync({ id, data }),
    changeServiceOrderStatus: (
      id: number,
      status: ServiceOrderStatus,
      observacao?: string,
    ) => statusMutation.mutateAsync({ id, status, observacao }),
    removeServiceOrder: (id: number) => deleteMutation.mutateAsync(id),
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      statusMutation.isPending,
    isChangingStatus: statusMutation.isPending,
  }
}

export function mapServiceOrdersPageItems(
  items: ReturnType<typeof useServiceOrdersList>['items'],
): ServiceOrder[] {
  if (items.length === 0) return emptyArray()
  return items.map(mapServiceOrder)
}
