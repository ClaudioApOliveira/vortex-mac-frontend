import { useCallback, useEffect, useState } from 'react'
import { Shield } from 'lucide-react'
import { ApiError } from '../api/errors'
import type { UserRequest } from '../api/types'
import { createUser, deleteUser, fetchUsers, updateUser } from '../api/users'
import {
  UserFormModal,
  UserProfileBadge,
} from '../components/users/UserFormModal'
import { useCustomers } from '../contexts/CustomerContext'
import type { UserFormData } from '../schemas/user.schema'
import { mapSystemUser } from '../types'
import type { SystemUser } from '../types'
import './UsersPage.css'

function toUserRequest(data: UserFormData, isEditing: boolean): UserRequest {
  const request: UserRequest = {
    email: data.email,
    nome: data.nome,
    perfil: data.perfil,
    ativo: data.ativo,
    clienteId:
      data.perfil === 'CLIENTE' && data.clienteId
        ? Number(data.clienteId)
        : null,
  }

  if (data.senha?.trim()) {
    request.senha = data.senha
  } else if (!isEditing) {
    request.senha = data.senha
  }

  return request
}

export function UsersPage() {
  const { customers } = useCustomers()
  const [users, setUsers] = useState<SystemUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchUsers()
      setUsers(response.map(mapSystemUser))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível carregar os usuários.'
      setError(message)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const openCreateModal = () => {
    setSelectedUser(null)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (user: SystemUser) => {
    setSelectedUser(user)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: UserFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload = toUserRequest(data, selectedUser !== null)

      if (selectedUser) {
        const updated = await updateUser(selectedUser.id, payload)
        const mapped = mapSystemUser(updated)
        setUsers((prev) =>
          prev.map((item) => (item.id === selectedUser.id ? mapped : item)),
        )
      } else {
        const created = await createUser(payload)
        setUsers((prev) => [mapSystemUser(created), ...prev])
      }

      setIsModalOpen(false)
      setSelectedUser(null)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : selectedUser
            ? 'Não foi possível atualizar o usuário.'
            : 'Não foi possível cadastrar o usuário.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (user: SystemUser) => {
    const confirmed = window.confirm(`Excluir o usuário ${user.nome}?`)
    if (!confirmed) return

    setSubmitError(null)
    try {
      await deleteUser(user.id)
      setUsers((prev) => prev.filter((item) => item.id !== user.id))
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Não foi possível excluir o usuário.'
      setSubmitError(message)
    }
  }

  const getCustomerName = (clienteId: number | null) => {
    if (!clienteId) return '—'
    return customers.find((customer) => customer.id === clienteId)?.nome ?? '—'
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Usuários</h1>
          <p className="page-subtitle">
            Gerencie os acessos ao sistema da oficina
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          + Novo Usuário
        </button>
      </header>

      {error && <p className="page-error-banner">{error}</p>}
      {submitError && <p className="page-error-banner">{submitError}</p>}

      {isLoading ? (
        <div className="empty-state">
          <p>Carregando usuários...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <Shield className="empty-icon" aria-hidden="true" />
          <h2>Nenhum usuário cadastrado</h2>
          <p>Cadastre usuários para liberar acesso ao sistema.</p>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            Cadastrar Usuário
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.nome}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <UserProfileBadge perfil={user.perfil} />
                  </td>
                  <td>{getCustomerName(user.clienteId)}</td>
                  <td>
                    <span
                      className={`status-badge ${user.ativo ? 'status-badge--active' : 'status-badge--inactive'}`}
                    >
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(user)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(user)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        user={selectedUser}
        customers={customers}
      />
    </div>
  )
}
