import { apiRequest } from './client'
import type { VehicleRequest, VehicleResponse } from './types'

export async function fetchVehicles() {
  return apiRequest<VehicleResponse[]>('/api/veiculos')
}

export async function fetchVehiclesByCustomer(clienteId: number) {
  return apiRequest<VehicleResponse[]>(`/api/veiculos/cliente/${clienteId}`)
}

export async function fetchVehicle(id: number) {
  return apiRequest<VehicleResponse>(`/api/veiculos/${id}`)
}

export async function createVehicle(data: VehicleRequest) {
  return apiRequest<VehicleResponse>('/api/veiculos', {
    method: 'POST',
    body: data,
  })
}

export async function updateVehicle(id: number, data: VehicleRequest) {
  return apiRequest<VehicleResponse>(`/api/veiculos/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteVehicle(id: number) {
  return apiRequest<void>(`/api/veiculos/${id}`, {
    method: 'DELETE',
  })
}
