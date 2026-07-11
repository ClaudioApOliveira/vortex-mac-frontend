import { apiRequest } from './client'
import type { MunicipioResponse } from './types'

export async function fetchMunicipiosByUf(uf: string) {
  const normalizedUf = uf.trim().toUpperCase()
  return apiRequest<MunicipioResponse[]>(
    `/api/localidades/estados/${normalizedUf}/municipios`,
    { auth: false },
  )
}
