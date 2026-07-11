import { apiRequest } from './client'
import type { UserRequest, UserResponse } from './types'

export async function fetchUsers() {
  return apiRequest<UserResponse[]>('/api/usuarios')
}

export async function fetchUser(id: number) {
  return apiRequest<UserResponse>(`/api/usuarios/${id}`)
}

export async function createUser(data: UserRequest) {
  return apiRequest<UserResponse>('/api/usuarios', {
    method: 'POST',
    body: data,
  })
}

export async function updateUser(id: number, data: UserRequest) {
  return apiRequest<UserResponse>(`/api/usuarios/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteUser(id: number) {
  return apiRequest<void>(`/api/usuarios/${id}`, {
    method: 'DELETE',
  })
}
