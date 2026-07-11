import { apiRequest } from './client'
import type {
  PageResponse,
  ServiceOrderRequest,
  ServiceOrderResponse,
  ServiceOrderStatusHistoryResponse,
} from './types'

function buildPageQuery(page: number, size: number) {
  return `?page=${page}&size=${size}`
}

export async function fetchServiceOrdersPage(page: number, size: number) {
  return apiRequest<PageResponse<ServiceOrderResponse>>(
    `/api/ordens-servico${buildPageQuery(page, size)}`,
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

export async function deleteServiceOrder(id: number) {
  return apiRequest<void>(`/api/ordens-servico/${id}`, {
    method: 'DELETE',
  })
}
