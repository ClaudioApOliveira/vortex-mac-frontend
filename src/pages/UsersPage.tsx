import { useState } from 'react'
import { Shield } from 'lucide-react'
import {
  UserFormModal,
  UserProfileBadge,
} from '../components/users/UserFormModal'
import { useCustomers } from '../hooks/useCustomers'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { useUsers } from '../hooks/useUsers'
import type { UserFormData } from '../schemas/user.schema'
import type { SystemUser } from '../types'
import { getSafeApiErrorMessage } from '../utils/apiMessages'
import './UsersPage.css'

export function UsersPage() {
  const { customers } = useCustomers()
  const { users, isLoading, error, addUser, editUser, removeUser } = useUsers()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      if (selectedUser) {
        await editUser(selectedUser.id, data)
      } else {
        await addUser(data)
      }

      setIsModalOpen(false)
      setSelectedUser(null)
    } catch (err) {
      setSubmitError(
        getSafeApiErrorMessage(
          err,
          selectedUser
            ? 'Não foi possível atualizar o usuário.'
            : 'Não foi possível cadastrar o usuário.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (user: SystemUser) => {
    const confirmed = await confirm({
      title: 'Excluir usuário',
      message: `Excluir o usuário ${user.nome}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!confirmed) return

    setSubmitError(null)
    try {
      await removeUser(user.id)
    } catch (err) {
      setSubmitError(getSafeApiErrorMessage(err, 'Não foi possível excluir o usuário.'))
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

      <ConfirmDialog />
    </div>
  )
}
