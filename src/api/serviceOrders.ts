import { apiRequest } from './client'
import type {
  PageResponse,
  ServiceOrderRequest,
  ServiceOrderResponse,
  ServiceOrderStatus,
  ServiceOrderStatusHistoryResponse,
} from './types'

export interface ServiceOrderListFilters {
  status?: ServiceOrderStatus | ''
  busca?: string
  tecnicoId?: string
  dataInicio?: string
  dataFim?: string
}

function buildListQuery(page: number, size: number, filters: ServiceOrderListFilters = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))

  if (filters.status) params.set('status', filters.status)
  if (filters.busca?.trim()) params.set('busca', filters.busca.trim())
  if (filters.tecnicoId) params.set('tecnicoId', filters.tecnicoId)
  if (filters.dataInicio) params.set('dataInicio', filters.dataInicio)
  if (filters.dataFim) params.set('dataFim', filters.dataFim)

  return `?${params.toString()}`
}

export async function fetchServiceOrdersPage(
  page: number,
  size: number,
  filters: ServiceOrderListFilters = {},
) {
  return apiRequest<PageResponse<ServiceOrderResponse>>(
    `/api/ordens-servico${buildListQuery(page, size, filters)}`,
  )
}

export async function fetchServiceOrdersByCustomer(clienteId: number) {
  return apiRequest<ServiceOrderResponse[]>(`/api/ordens-servico/cliente/${clienteId}`)
}

export async function fetchServiceOrdersByVehicle(veiculoId: number) {
  return apiRequest<ServiceOrderResponse[]>(`/api/ordens-servico/veiculo/${veiculoId}`)
}

export async function fetchServiceOrder(id: number) {
  return apiRequest<ServiceOrderResponse>(`/api/ordens-servico/${id}`)
}

export async function fetchServiceOrderStatusHistory(id: number) {
  return apiRequest<ServiceOrderStatusHistoryResponse[]>(
    `/api/ordens-servico/${id}/historico-status`,
  )
}

export async function createServiceOrder(data: ServiceOrderRequest) {
  return apiRequest<ServiceOrderResponse>('/api/ordens-servico', {
    method: 'POST',
    body: data,
  })
}

export async function updateServiceOrder(id: number, data: ServiceOrderRequest) {
  return apiRequest<ServiceOrderResponse>(`/api/ordens-servico/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function updateServiceOrderStatus(
  id: number,
  status: ServiceOrderStatus,
  observacao?: string,
) {
  return apiRequest<ServiceOrderResponse>(`/api/ordens-servico/${id}/status`, {
    method: 'PATCH',
    body: { status, observacao: observacao || null },
  })
}

export async function deleteServiceOrder(id: number) {
  return apiRequest<void>(`/api/ordens-servico/${id}`, {
    method: 'DELETE',
  })
}
