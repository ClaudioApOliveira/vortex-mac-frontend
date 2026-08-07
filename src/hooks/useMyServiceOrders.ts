import {
  approveMyServiceOrder,
  fetchAllMyServiceOrders,
  fetchMyServiceOrdersPage,
  rejectMyServiceOrder,
} from '../api/auth'
import { emptyArray } from '../constants/empty'
import { canViewMyServiceOrders } from '../utils/permissions'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import { mapServiceOrder } from '../types'
import type { ServiceOrder } from '../types'
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
    live: true,
  })
}

interface MyServiceOrdersDashboardData {
  serviceOrders: ServiceOrder[]
  pendingBudgets: ServiceOrder[]
}

export function useMyServiceOrdersDashboard() {
  const { user, isAuthenticated } = useAuth()
  const enabled = isAuthenticated && canViewMyServiceOrders(user)

  const query = useQuery({
    queryKey: [...queryKeys.myServiceOrders.all, 'dashboard'],
    queryFn: fetchAllMyServiceOrders,
    enabled,
    staleTime: 30_000,
    select: (data): MyServiceOrdersDashboardData => {
      const serviceOrders = data.map(mapServiceOrder)
      return {
        serviceOrders,
        pendingBudgets: serviceOrders.filter((order) => order.status === 'ORCAMENTO'),
      }
    },
  })

  const serviceOrders = query.data?.serviceOrders ?? emptyArray<ServiceOrder>()
  const pendingBudgets = query.data?.pendingBudgets ?? emptyArray<ServiceOrder>()

  return {
    serviceOrders,
    pendingBudgets,
    totalElements: serviceOrders.length,
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
