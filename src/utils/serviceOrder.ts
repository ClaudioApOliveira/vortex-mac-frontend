import type { ServiceOrderStatus, ServiceOrderStatusHistoryOrigin } from '../api/types'

const SERVICE_ORDER_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  ORCAMENTO: 'Orçamento',
  APROVADO: 'Aprovado',
  EM_EXECUCAO: 'Em execução',
  AGUARDANDO_PECAS: 'Aguardando peças',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

export function getServiceOrderStatusLabel(status: ServiceOrderStatus) {
  return SERVICE_ORDER_STATUS_LABELS[status]
}

export function getServiceOrderStatusClass(status: ServiceOrderStatus) {
  return `os-status os-status--${status.toLowerCase()}`
}

export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatServiceOrderDateTime(data: string, hora: string) {
  const date = new Date(`${data}T${hora}`)
  if (Number.isNaN(date.getTime())) {
    return `${data} ${hora.slice(0, 5)}`
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatKm(value?: number | null) {
  if (value === undefined || value === null) return '—'
  return value.toLocaleString('pt-BR')
}

export function getServiceOrderItemTypeLabel(tipo: 'PECA' | 'SERVICO') {
  return tipo === 'PECA' ? 'Peça' : 'Serviço'
}

const STATUS_HISTORY_ORIGIN_LABELS: Record<ServiceOrderStatusHistoryOrigin, string> = {
  CLIENTE: 'Cliente',
  ADMIN: 'Administrador',
  TECNICO: 'Técnico',
  SISTEMA: 'Sistema',
}

export function getServiceOrderStatusHistoryOriginLabel(origem: ServiceOrderStatusHistoryOrigin) {
  return STATUS_HISTORY_ORIGIN_LABELS[origem]
}

export function formatServiceOrderStatusHistoryEntry(
  statusAnterior: ServiceOrderStatus | null | undefined,
  statusNovo: ServiceOrderStatus,
) {
  if (!statusAnterior) {
    return getServiceOrderStatusLabel(statusNovo)
  }

  return `${getServiceOrderStatusLabel(statusAnterior)} → ${getServiceOrderStatusLabel(statusNovo)}`
}

export function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
