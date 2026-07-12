import { useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { ApiError } from '../api/errors'
import { ServiceOrderFormModal } from '../components/serviceOrders/ServiceOrderFormModal'
import { ServiceOrderStatusBadge } from '../components/serviceOrders/ServiceOrderStatusBadge'
import '../components/serviceOrders/ServiceOrderStatusBadge.css'
import { Pagination } from '../components/ui/Pagination'
import '../components/ui/Pagination.css'
import { DEFAULT_PAGE_SIZE } from '../constants/pagination'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import {
  mapServiceOrdersPageItems,
  useServiceOrderMutations,
  useServiceOrdersList,
} from '../hooks/useServiceOrders'
import { usePaginationState } from '../hooks/usePaginationState'
import type { ServiceOrderFormData } from '../schemas/serviceOrder.schema'
import type { ServiceOrder } from '../types'
import { displayPlaca } from '../utils/masks'
import {
  formatCurrency,
  formatKm,
  formatServiceOrderDateTime,
} from '../utils/serviceOrder'
import './CustomersPage.css'

export function ServiceOrdersPage() {
  const { page, pageSize, setPage, setPageSize } = usePaginationState(DEFAULT_PAGE_SIZE)
  const {
    items,
    totalElements,
    totalPages,
    isLoading,
    isFetching,
    error,
  } = useServiceOrdersList(page, pageSize)
  const { addServiceOrder, editServiceOrder, removeServiceOrder, isMutating } =
    useServiceOrderMutations()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const serviceOrders = useMemo(() => mapServiceOrdersPageItems(items), [items])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : error
          ? 'Não foi possível carregar as ordens de serviço.'
          : null

  const openCreateModal = () => {
    setSelectedServiceOrder(null)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (serviceOrder: ServiceOrder) => {
    setSelectedServiceOrder(serviceOrder)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: ServiceOrderFormData) => {
    setSubmitError(null)

    try {
      if (selectedServiceOrder) {
        await editServiceOrder(selectedServiceOrder.id, data)
      } else {
        await addServiceOrder(data)
        setPage(0)
      }
      setIsModalOpen(false)
      setSelectedServiceOrder(null)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : selectedServiceOrder
            ? 'Não foi possível atualizar a ordem de serviço.'
            : 'Não foi possível cadastrar a ordem de serviço.'
      setSubmitError(message)
    }
  }

  const handleDelete = async (serviceOrder: ServiceOrder) => {
    const confirmed = await confirm({
      title: 'Excluir ordem de serviço',
      message: `Excluir a OS de ${serviceOrder.clienteNome} (${formatServiceOrderDateTime(serviceOrder.data, serviceOrder.hora)})?`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    })
    if (!confirmed) return

    setSubmitError(null)
    try {
      await removeServiceOrder(serviceOrder.id)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Não foi possível excluir a ordem de serviço.'
      setSubmitError(message)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Ordens de Serviço</h1>
          <p className="page-subtitle">
            Registre atendimentos, peças e serviços da oficina
            {isFetching && !isLoading ? ' · Atualizando...' : ''}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          + Nova OS
        </button>
      </header>

      {errorMessage && <p className="page-error-banner">{errorMessage}</p>}
      {submitError && <p className="page-error-banner">{submitError}</p>}

      {isLoading ? (
        <div className="empty-state">
          <p>Carregando ordens de serviço...</p>
        </div>
      ) : serviceOrders.length === 0 ? (
        <div className="empty-state">
          <ClipboardList className="empty-icon" aria-hidden="true" />
          <h2>Nenhuma ordem de serviço cadastrada</h2>
          <p>Comece registrando o primeiro atendimento da oficina.</p>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            Nova OS
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Proprietário</th>
                  <th>Veículo</th>
                  <th>Status</th>
                  <th>Técnico</th>
                  <th>KM entrada</th>
                  <th>KM saída</th>
                  <th>Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {serviceOrders.map((serviceOrder) => (
                  <tr key={serviceOrder.id}>
                    <td>{formatServiceOrderDateTime(serviceOrder.data, serviceOrder.hora)}</td>
                    <td>
                      <strong>{serviceOrder.clienteNome}</strong>
                    </td>
                    <td>
                      <span className="plate-badge">
                        {displayPlaca(serviceOrder.veiculoPlaca)}
                      </span>
                      <div>
                        {serviceOrder.veiculoMarca} {serviceOrder.veiculoModelo}
                      </div>
                    </td>
                    <td>
                      <ServiceOrderStatusBadge status={serviceOrder.status} />
                    </td>
                    <td>{serviceOrder.tecnicoNome}</td>
                    <td>{formatKm(serviceOrder.kmEntrada)}</td>
                    <td>{formatKm(serviceOrder.kmSaida)}</td>
                    <td>
                      <strong>{formatCurrency(serviceOrder.precoTotal)}</strong>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(serviceOrder)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(serviceOrder)}
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
            isLoading={isFetching}
          />
        </>
      )}

      <ServiceOrderFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedServiceOrder(null)
        }}
        onSubmit={handleSubmit}
        isSubmitting={isMutating}
        serviceOrder={selectedServiceOrder}
      />

      <ConfirmDialog />
    </div>
  )
}
