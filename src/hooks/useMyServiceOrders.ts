import {
  approveMyServiceOrder,
  fetchMyServiceOrdersPage,
  rejectMyServiceOrder,
} from '../api/auth'
import { canViewMyServiceOrders } from '../utils/permissions'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import { mapServiceOrder } from '../types'
import { usePaginatedQuery } from './usePaginatedQuery'

export function useMyServiceOrdersList(page: number, pageSize: number) {
  const { user, isAuthenticated } = useAuth()
  const enabled = isAuthenticated && canViewMyServiceOrders(user)

  return usePaginatedQuery({
    queryKey: queryKeys.myServiceOrders.all,
    queryFn: fetchMyServiceOrdersPage,
    page,
    pageSize,
    enabled,
  })
}

export function useMyServiceOrdersDashboard(pageSize = 50) {
  const query = useMyServiceOrdersList(0, pageSize)

  const serviceOrders = query.items.map(mapServiceOrder)
  const pendingBudgets = serviceOrders.filter((order) => order.status === 'ORCAMENTO')

  return {
    serviceOrders,
    pendingBudgets,
    totalElements: query.totalElements,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useMyServiceOrderMutations() {
  const queryClient = useQueryClient()

  const invalidateLists = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.myServiceOrders.all })
  }

  const approveMutation = useMutation({
    mutationFn: approveMyServiceOrder,
    onSuccess: invalidateLists,
  })

  const rejectMutation = useMutation({
    mutationFn: rejectMyServiceOrder,
    onSuccess: invalidateLists,
  })

  return {
    approveMyServiceOrder: approveMutation.mutateAsync,
    rejectMyServiceOrder: rejectMutation.mutateAsync,
    isDeciding: approveMutation.isPending || rejectMutation.isPending,
  }
}
