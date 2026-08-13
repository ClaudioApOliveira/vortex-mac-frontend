import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { anonymizeCustomer, fetchDeletionRequests } from '../api/customers'
import { emptyArray } from '../constants/empty'
import { useAuth } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import { mapCustomer } from '../types'
import type { Customer } from '../types'
import { getSafeApiErrorMessage } from '../utils/apiMessages'
import { canAccessLgpdQueue } from '../utils/permissions'

export function useLgpdDeletionRequests() {
  const { user, isAuthenticated } = useAuth()
  const enabled = isAuthenticated && canAccessLgpdQueue(user)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.customers.deletionRequests,
    queryFn: fetchDeletionRequests,
    enabled,
    select: (data) => data.map(mapCustomer),
  })

  const anonymizeMutation = useMutation({
    mutationFn: async (id: number) => mapCustomer(await anonymizeCustomer(id)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.deletionRequests }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
      ])
    },
  })

  return {
    requests: query.data ?? emptyArray<Customer>(),
    isLoading: query.isLoading,
    error: query.error
      ? getSafeApiErrorMessage(query.error, 'Não foi possível carregar as solicitações.')
      : null,
    anonymize: (id: number) => anonymizeMutation.mutateAsync(id),
    isAnonymizing: anonymizeMutation.isPending,
  }
}
