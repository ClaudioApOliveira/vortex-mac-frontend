import { apiRequest } from './client'
import type { CustomerRequest, CustomerResponse } from './types'

export async function fetchCustomers() {
  return apiRequest<CustomerResponse[]>('/api/clientes')
}

export async function fetchCustomer(id: number) {
  return apiRequest<CustomerResponse>(`/api/clientes/${id}`)
}

export async function createCustomer(data: CustomerRequest) {
  return apiRequest<CustomerResponse>('/api/clientes', {
    method: 'POST',
    body: data,
  })
}

export async function updateCustomer(id: number, data: CustomerRequest) {
  return apiRequest<CustomerResponse>(`/api/clientes/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteCustomer(id: number) {
  return apiRequest<void>(`/api/clientes/${id}`, {
    method: 'DELETE',
  })
}
