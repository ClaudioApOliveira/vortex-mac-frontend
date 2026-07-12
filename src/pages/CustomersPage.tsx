import { useMemo, useState } from 'react'
import { Eye, Users } from 'lucide-react'
import { ApiError } from '../api/errors'
import { CustomerDetailModal } from '../components/customers/CustomerDetailModal'
import { CustomerFormModal } from '../components/customers/CustomerFormModal'
import { Pagination } from '../components/ui/Pagination'
import '../components/ui/Pagination.css'
import { DEFAULT_PAGE_SIZE } from '../constants/pagination'
import { useCustomers } from '../hooks/useCustomers'
import { useVehicles } from '../hooks/useVehicles'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { usePaginationState } from '../hooks/usePaginationState'
import type { CustomerFormData } from '../schemas/customer.schema'
import type { VehicleFormData } from '../schemas/vehicle.schema'
import type { Customer } from '../types'
import { formatCpfCnpj } from '../utils/masks'
import { getSafeApiErrorMessage } from '../utils/apiMessages'
import './CustomersPage.css'

export function CustomersPage() {
  const {
    customers,
    isLoading,
    error,
    addCustomer,
    editCustomer,
    removeCustomer,
  } = useCustomers()
  const { addVehicle } = useVehicles()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const { page, pageSize, setPage, setPageSize } = usePaginationState(DEFAULT_PAGE_SIZE)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitWarning, setSubmitWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalElements = customers.length
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))
  const paginatedCustomers = useMemo(
    () => customers.slice(page * pageSize, page * pageSize + pageSize),
    [customers, page, pageSize],
  )

  const openCreateModal = () => {
    setSelectedCustomer(null)
    setSubmitError(null)
    setSubmitWarning(null)
    setIsModalOpen(true)
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSubmitError(null)
    setSubmitWarning(null)
    setIsModalOpen(true)
  }

  const openDetailModal = (customer: Customer) => {
    setDetailCustomer(customer)
  }

  const handleSubmit = async (data: CustomerFormData, vehicle?: VehicleFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitWarning(null)

    try {
      if (selectedCustomer) {
        await editCustomer(selectedCustomer.id, data)
        setIsModalOpen(false)
        setSelectedCustomer(null)
        return
      }

      const created = await addCustomer(data)

      if (!vehicle) {
        setIsModalOpen(false)
        setSelectedCustomer(null)
        return
      }

      try {
        await addVehicle(created.id, vehicle)
        setIsModalOpen(false)
        setSelectedCustomer(null)
      } catch (vehicleError) {
        setIsModalOpen(false)
        setSelectedCustomer(null)
        setSubmitWarning(
          `Cliente "${created.nome}" cadastrado com sucesso, mas o veículo não foi salvo. Cadastre o veículo na página Veículos.`,
        )
        if (vehicleError instanceof ApiError) {
          console.error('Falha ao cadastrar veículo do novo cliente', vehicleError)
        }
      }
    } catch (err) {
      const message = getSafeApiErrorMessage(
        err,
        selectedCustomer
          ? 'Não foi possível atualizar o cliente.'
          : 'Não foi possível cadastrar o cliente.',
      )
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (customer: Customer) => {
    const confirmed = await confirm({
      title: 'Excluir cliente',
      message: `Excluir o cliente ${customer.nome}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!confirmed) return

    setSubmitError(null)
    setSubmitWarning(null)
    try {
      await removeCustomer(customer.id)
    } catch (err) {
      setSubmitError(
        getSafeApiErrorMessage(err, 'Não foi possível excluir o cliente.'),
      )
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="page-subtitle">
            Gerencie os proprietários da oficina
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          + Novo Cliente
        </button>
      </header>

      {error && <p className="page-error-banner">{error}</p>}
      {submitError && <p className="page-error-banner">{submitError}</p>}
      {submitWarning && <p className="page-warning-banner">{submitWarning}</p>}

      {isLoading ? (
        <div className="empty-state">
          <p>Carregando clientes...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <Users className="empty-icon" aria-hidden="true" />
          <h2>Nenhum cliente cadastrado</h2>
          <p>Comece cadastrando o primeiro cliente da oficina.</p>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            Cadastrar Cliente
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Proprietário</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>CPF/CNPJ</th>
                  <th>Cadastrado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.nome}</strong>
                    </td>
                    <td>{customer.email ?? '—'}</td>
                    <td>{customer.telefone ?? '—'}</td>
                    <td>
                      {customer.cpf ?? customer.cnpj
                        ? formatCpfCnpj(customer.cpf ?? customer.cnpj ?? '')
                        : '—'}
                    </td>
                    <td>
                      {new Date(customer.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openDetailModal(customer)}
                        >
                          <Eye aria-hidden="true" />
                          Ver detalhes
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(customer)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(customer)}
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

          <Pagination
            page={page}
            pageSize={pageSize}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            isLoading={isLoading}
          />
        </>
      )}

      <CustomerDetailModal
        isOpen={detailCustomer !== null}
        onClose={() => setDetailCustomer(null)}
        customer={detailCustomer}
      />

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedCustomer(null)
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        customer={selectedCustomer}
      />

      <ConfirmDialog />
    </div>
  )
}
