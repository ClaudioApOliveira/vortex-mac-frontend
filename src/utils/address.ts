import { fetchCep } from '../api/ceps'
import { ApiError } from '../api/errors'
import type { Customer } from '../types'

export function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function formatCustomerAddress(customer: Customer) {
  const street = [customer.logradouro, customer.numero].filter(Boolean).join(', ')
  const cityState = [customer.cidade, customer.uf].filter(Boolean).join(' - ')

  const parts = [street, customer.bairro, cityState, customer.cep].filter(Boolean)
  return parts.join(' · ') || '—'
}

export interface CepLookupResult {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  estado?: string
  ibge?: string
}

export async function fetchAddressByCep(cep: string): Promise<CepLookupResult | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null

  try {
    const data = await fetchCep(cep)

    return {
      cep: data.cep ? formatCep(data.cep) : formatCep(digits),
      logradouro: data.logradouro ?? undefined,
      complemento: data.complemento ?? undefined,
      bairro: data.bairro ?? undefined,
      cidade: data.cidade ?? undefined,
      uf: data.uf?.toUpperCase() ?? undefined,
      estado: data.estado ?? undefined,
      ibge: data.ibge ?? undefined,
    }
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null
    }
    throw error
  }
}

export function emptyToUndefined(value?: string) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

export interface MunicipioLike {
  id: number
  nome: string
  uf: string
}

export function findMunicipio(
  municipios: MunicipioLike[],
  cidade?: string,
  ibge?: string,
): MunicipioLike | undefined {
  const normalizedIbge = ibge?.replace(/\D/g, '')

  if (normalizedIbge) {
    const byIbge = municipios.find((municipio) => String(municipio.id) === normalizedIbge)
    if (byIbge) return byIbge
  }

  const normalizedCity = cidade?.trim()
  if (!normalizedCity) return undefined

  return municipios.find(
    (municipio) =>
      municipio.nome.localeCompare(normalizedCity, 'pt-BR', { sensitivity: 'base' }) === 0,
  )
}
