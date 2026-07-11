import { ApiError } from '../api/errors'

const GENERIC_BY_STATUS: Record<number, string> = {
  400: 'Não foi possível processar a solicitação. Verifique os dados informados.',
  401: 'Credenciais inválidas ou sessão expirada.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Registro não encontrado.',
  409: 'Não foi possível concluir a operação.',
  429: 'Muitas requisições. Aguarde alguns instantes e tente novamente.',
}

export function getSafeApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return error.message || GENERIC_BY_STATUS[429]
    }

    return GENERIC_BY_STATUS[error.status] ?? fallback
  }

  return fallback
}

export function getLoginErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'E-mail ou senha incorretos.'
  }

  return getSafeApiErrorMessage(error, 'Não foi possível entrar. Tente novamente.')
}

export function getFirstAccessErrorMessage(error: unknown) {
  return getSafeApiErrorMessage(
    error,
    'Não foi possível concluir o primeiro acesso. Verifique os dados informados.',
  )
}

export const FIRST_ACCESS_INELIGIBLE_MESSAGE =
  'Se o e-mail estiver elegível, você poderá definir sua senha. Caso contrário, solicite seu cadastro à oficina.'
