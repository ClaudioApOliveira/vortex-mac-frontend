import { API_BASE_URL } from '../config/api'
import { apiRequest } from './client'
import { parseApiData, parseApiError } from './errors'
import { getRefreshToken, setTokensFromResponse } from './tokenStorage'
import type {
  ChangePasswordRequest,
  PageResponse,
  ServiceOrderResponse,
  ServiceOrderStatusHistoryResponse,
  TokenResponse,
  UpdateProfileRequest,
  UserResponse,
  VerificarPrimeiroAcessoResponse,
} from './types'

function buildPageQuery(page: number, size: number) {
  return `?page=${page}&size=${size}`
}

export async function loginRequest(email: string, senha: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  const data = await parseApiData<TokenResponse>(response)

  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error('Resposta de login inválida.')
  }

  setTokensFromResponse(data)
  return data
}

export async function verificarPrimeiroAcesso(email: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/verificar-primeiro-acesso`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  const data = await parseApiData<VerificarPrimeiroAcessoResponse>(response)

  if (!data) {
    throw new Error('Resposta de verificação inválida.')
  }

  return data
}

export async function primeiroAcessoRequest(
  email: string,
  senha: string,
  confirmarSenha: string,
) {
  const response = await fetch(`${API_BASE_URL}/api/auth/primeiro-acesso`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha, confirmarSenha }),
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  const data = await parseApiData<TokenResponse>(response)

  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error('Resposta de primeiro acesso inválida.')
  }

  setTokensFromResponse(data)
  return data
}

export async function fetchCurrentUser() {
  return apiRequest<UserResponse>('/api/auth/me')
}

export async function fetchMyServiceOrdersPage(page: number, size: number) {
  return apiRequest<PageResponse<ServiceOrderResponse>>(
    `/api/auth/me/ordens-servico${buildPageQuery(page, size)}`,
  )
}

export async function fetchAllMyServiceOrders() {
  const pageSize = 50
  let page = 0
  let totalPages = 1
  const orders: ServiceOrderResponse[] = []

  while (page < totalPages) {
    const response = await fetchMyServiceOrdersPage(page, pageSize)
    orders.push(...response.content)
    totalPages = response.totalPages
    page += 1
  }

  return orders
}

export async function fetchMyServiceOrder(id: number) {
  return apiRequest<ServiceOrderResponse>(`/api/auth/me/ordens-servico/${id}`)
}

export async function approveMyServiceOrder(id: number) {
  return apiRequest<ServiceOrderResponse>(`/api/auth/me/ordens-servico/${id}/aprovar`, {
    method: 'POST',
  })
}

export async function rejectMyServiceOrder(id: number) {
  return apiRequest<ServiceOrderResponse>(`/api/auth/me/ordens-servico/${id}/rejeitar`, {
    method: 'POST',
  })
}

export async function fetchMyServiceOrderStatusHistory(id: number) {
  return apiRequest<ServiceOrderStatusHistoryResponse[]>(
    `/api/auth/me/ordens-servico/${id}/historico-status`,
  )
}

export async function updateCurrentUserProfile(data: UpdateProfileRequest) {
  return apiRequest<UserResponse>('/api/auth/me', {
    method: 'PUT',
    body: data,
  })
}

export async function changeCurrentUserPassword(data: ChangePasswordRequest) {
  const tokens = await apiRequest<TokenResponse>('/api/auth/me/senha', {
    method: 'PUT',
    body: data,
  })

  if (!tokens?.accessToken || !tokens?.refreshToken) {
    throw new Error('Resposta de alteração de senha inválida.')
  }

  setTokensFromResponse(tokens)
  return tokens
}

export async function logoutRequest() {
  const refreshToken = getRefreshToken()

  try {
    await apiRequest<void>('/api/auth/logout', {
      method: 'POST',
      body: { refreshToken: refreshToken ?? null },
    })
  } catch {
    // A sessão pode já estar inválida; a limpeza local ocorre no caller.
  }
}
