import type { UserProfile, ServiceOrderStatus } from '../api/types'
import type { User } from '../types'
import { SERVICE_ORDER_STATUSES } from '../schemas/serviceOrder.schema'

const STAFF_PROFILES: UserProfile[] = ['ADMIN', 'GERENTE', 'TECNICO']

function isStaff(user: User | null) {
  return user != null && STAFF_PROFILES.includes(user.perfil)
}

export function canManageCustomers(user: User | null) {
  return isStaff(user)
}

export function canManageVehicles(user: User | null) {
  return isStaff(user)
}

export function canManageServiceOrders(user: User | null) {
  return isStaff(user)
}

export function canManageUsers(user: User | null) {
  return user?.perfil === 'ADMIN' || user?.perfil === 'GERENTE'
}

export function canManageAdminUsers(user: User | null) {
  return user?.perfil === 'ADMIN'
}

export function canViewMyServiceOrders(user: User | null) {
  return user?.perfil === 'CLIENTE' && user.clienteId != null
}

export function getProfileLabel(perfil: UserProfile) {
  const labels: Record<UserProfile, string> = {
    ADMIN: 'Administrador',
    GERENTE: 'Gerente',
    TECNICO: 'Técnico',
    CLIENTE: 'Cliente',
  }
  return labels[perfil]
}

export function getEditableServiceOrderStatuses(user: User | null): ServiceOrderStatus[] {
  if (user?.perfil === 'TECNICO') {
    return SERVICE_ORDER_STATUSES.filter((status) => status !== 'APROVADO')
  }

  return [...SERVICE_ORDER_STATUSES]
}
