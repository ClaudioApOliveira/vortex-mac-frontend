import { apiRequest } from './client'
import type { UserResponse } from './types'

export async function fetchTechnicians() {
  return apiRequest<UserResponse[]>('/api/tecnicos')
}
