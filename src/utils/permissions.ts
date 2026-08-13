import type { UserProfile } from '../api/types'
import type { User } from '../types'

const STAFF_PROFILES: UserProfile[] = ['ADMIN', 'GERENTE', 'TECNICO']

function isStaff(user: User | null) {
  return user != null && STAFF_PROFILES.includes(user.perfil)
}

export function canManageCustomers(user: User | null) {
  return isStaff(user)
}

export function canCreateCustomers(user: User | null) {
  return user?.perfil === 'ADMIN' || user?.perfil === 'GERENTE'
}

export function canManageVehicles(user: User | null) {
  return isStaff(user)
}

export function canDeleteVehicles(user: User | null) {
  return user?.perfil === 'ADMIN' || user?.perfil === 'GERENTE'
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

export function canDeleteServiceOrders(user: User | null) {
  return user?.perfil === 'ADMIN'
}

export function canDeleteCustomers(user: User | null) {
  return user?.perfil === 'ADMIN' || user?.perfil === 'GERENTE'
}

export function canAnonymizeCustomers(user: User | null) {
  return user?.perfil === 'ADMIN'
}

export function canAccessLgpdQueue(user: User | null) {
  return user?.perfil === 'ADMIN'
}

export function canAccessOfficeReports(user: User | null) {
  return isStaff(user)
}

export function canAccessLgpdPrivacy(user: User | null) {
  return user?.perfil === 'CLIENTE'
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
