import { apiRequest } from './client'
import type { CepResponse } from './types'

export async function fetchCep(cep: string) {
  const digits = cep.replace(/\D/g, '')
  return apiRequest<CepResponse>(`/api/ceps/${digits}`)
}
