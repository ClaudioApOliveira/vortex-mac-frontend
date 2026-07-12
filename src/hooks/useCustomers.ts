import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
} from '../api/customers'
import { useAuth } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import type { CustomerFormData } from '../schemas/customer.schema'
import { mapCustomer } from '../types'
import type { Customer } from '../types'
import { getSafeApiErrorMessage } from '../utils/apiMessages'
import { toCustomerRequest } from '../utils/customerRequest'
import { canManageCustomers } from '../utils/permissions'

function toCustomerList(data: Awaited<ReturnType<typeof fetchCustomers>>) {
  return data.map(mapCustomer)
}

export function useCustomers() {
  const { user, isAuthenticated } = useAuth()
  const enabled = isAuthenticated && canManageCustomers(user)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.customers.all,
    queryFn: fetchCustomers,
    enabled,
    select: toCustomerList,
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
  }

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const created = await createCustomer(toCustomerRequest(data))
      return mapCustomer(created)
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CustomerFormData }) => {
      const updated = await updateCustomer(id, toCustomerRequest(data))
      return mapCustomer(updated)
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: invalidate,
  })

  const error = query.error
    ? getSafeApiErrorMessage(query.error, 'Não foi possível carregar os clientes.')
    : null

  return {
    customers: query.data ?? ([] as Customer[]),
    isLoading: query.isLoading,
    error,
    addCustomer: (data: CustomerFormData) => createMutation.mutateAsync(data),
    editCustomer: (id: number, data: CustomerFormData) =>
      updateMutation.mutateAsync({ id, data }),
    removeCustomer: (id: number) => deleteMutation.mutateAsync(id),
    refreshCustomers: invalidate,
    isMutating:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  }
}
