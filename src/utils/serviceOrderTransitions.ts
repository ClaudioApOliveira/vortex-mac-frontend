import type { ServiceOrderStatus } from '../api/types'
import type { User } from '../types'
import { getServiceOrderStatusLabel } from './serviceOrder'

const ALLOWED_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  ORCAMENTO: ['APROVADO', 'CANCELADO'],
  APROVADO: ['EM_EXECUCAO', 'AGUARDANDO_PECAS', 'CANCELADO'],
  EM_EXECUCAO: ['AGUARDANDO_PECAS', 'CONCLUIDO', 'CANCELADO'],
  AGUARDANDO_PECAS: ['EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO'],
  CONCLUIDO: [],
  CANCELADO: ['ORCAMENTO'],
}

export interface ServiceOrderStatusAction {
  status: ServiceOrderStatus
  label: string
  variant: 'primary' | 'secondary' | 'danger'
  confirm?: string
}

const ACTION_META: Record<
  ServiceOrderStatus,
  { label: string; variant: ServiceOrderStatusAction['variant']; confirm?: string }
> = {
  ORCAMENTO: {
    label: 'Reabrir orçamento',
    variant: 'primary',
    confirm: 'Reabrir esta OS como orçamento para revisão?',
  },
  APROVADO: { label: 'Aprovar', variant: 'primary' },
  EM_EXECUCAO: { label: 'Em execução', variant: 'primary' },
  AGUARDANDO_PECAS: { label: 'Aguardando peças', variant: 'secondary' },
  CONCLUIDO: {
    label: 'Concluir',
    variant: 'primary',
    confirm: 'Concluir esta OS? Depois disso ela não poderá mais ser editada.',
  },
  CANCELADO: {
    label: 'Cancelar',
    variant: 'danger',
    confirm: 'Cancelar esta ordem de serviço?',
  },
}

function canSetStatus(user: User | null, status: ServiceOrderStatus) {
  if (status === 'APROVADO') {
    return user?.perfil === 'ADMIN' || user?.perfil === 'GERENTE'
  }
  return true
}

export function getAllowedServiceOrderTransitions(
  current: ServiceOrderStatus,
  user: User | null,
): ServiceOrderStatus[] {
  return ALLOWED_TRANSITIONS[current].filter((status) => canSetStatus(user, status))
}

export function getServiceOrderStatusActions(
  current: ServiceOrderStatus,
  user: User | null,
): ServiceOrderStatusAction[] {
  return getAllowedServiceOrderTransitions(current, user).map((status) => {
    const meta = ACTION_META[status]
    let label = meta.label
    if (status === 'EM_EXECUCAO' && current === 'AGUARDANDO_PECAS') {
      label = 'Retomar execução'
    } else if (status === 'EM_EXECUCAO' && current === 'APROVADO') {
      label = 'Iniciar execução'
    }
    return {
      status,
      label,
      variant: meta.variant,
      confirm: meta.confirm,
    }
  })
}

/** Status options for the edit form: current + allowed next. */
export function getFormStatusOptions(
  current: ServiceOrderStatus,
  user: User | null,
): ServiceOrderStatus[] {
  const next = getAllowedServiceOrderTransitions(current, user)
  return [current, ...next.filter((status) => status !== current)]
}

export function describeStatusTransition(
  from: ServiceOrderStatus,
  to: ServiceOrderStatus,
) {
  return `${getServiceOrderStatusLabel(from)} → ${getServiceOrderStatusLabel(to)}`
}

export function isActiveWorkshopStatus(status: ServiceOrderStatus) {
  return (
    status === 'APROVADO' ||
    status === 'EM_EXECUCAO' ||
    status === 'AGUARDANDO_PECAS'
  )
}
