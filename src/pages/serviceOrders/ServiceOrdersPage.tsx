import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Eye } from 'lucide-react'
import { ApiError } from '../../api/errors'
import { fetchServiceOrder } from '../../api/serviceOrders'
import { fetchTechnicians } from '../../api/technicians'
import type { ServiceOrderStatus } from '../../api/types'
import { ServiceOrderDetailModal } from '../../components/serviceOrders/ServiceOrderDetailModal'
import { ServiceOrderFormModal } from '../../components/serviceOrders/ServiceOrderFormModal'
import { ServiceOrderStatusActions } from '../../components/serviceOrders/ServiceOrderStatusActions'
import { ServiceOrderStatusBadge } from '../../components/serviceOrders/ServiceOrderStatusBadge'
import '../../components/serviceOrders/ServiceOrderStatusBadge.css'
import { Pagination } from '../../components/ui/Pagination'
import { FormField } from '../../components/ui/FormField'
import { SelectField } from '../../components/ui/SelectField'
import '../../components/ui/Pagination.css'
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination'
import { useAuth } from '../../contexts/AuthContext'
import { useConfirmDialog } from '../../hooks/useConfirmDialog'
import {
  mapServiceOrdersPageItems,
  useServiceOrderMutations,
  useServiceOrdersList,
  type ServiceOrderListFilters,
} from '../../hooks/useServiceOrders'
import { usePaginationState } from '../../hooks/usePaginationState'
import { SERVICE_ORDER_STATUSES, type ServiceOrderFormData } from '../../schemas/serviceOrder.schema'
import type { ServiceOrder, Technician } from '../../types'
import { mapServiceOrder, mapTechnician } from '../../types'
import { displayPlaca } from '../../utils/masks'
import { canDeleteServiceOrders } from '../../utils/permissions'
import {
  formatCurrency,
  formatKm,
  formatServiceOrderDateTime,
  getServiceOrderStatusLabel,
  isServiceOrderLocked,
} from '../../utils/serviceOrder'
import '../customers/CustomersPage.css'
import './pageFilters.css'

const EMPTY_FILTERS: ServiceOrderListFilters = {
  status: '',
  busca: '',
  tecnicoId: '',
  dataInicio: '',
  dataFim: '',
}

function hasActiveFilters(filters: ServiceOrderListFilters) {
  return Boolean(
    filters.status ||
      filters.busca?.trim() ||
      filters.tecnicoId ||
      filters.dataInicio ||
      filters.dataFim,
  )
}

export function ServiceOrdersPage() {
  const { user } = useAuth()
  const { page, pageSize, setPage, setPageSize } = usePaginationState(DEFAULT_PAGE_SIZE)
  const [filters, setFilters] = useState<ServiceOrderListFilters>(() =>
    user?.perfil === 'TECNICO' && user.id
      ? { ...EMPTY_FILTERS, tecnicoId: String(user.id) }
      : EMPTY_FILTERS,
  )
  const [draftFilters, setDraftFilters] = useState<ServiceOrderListFilters>(() =>
    user?.perfil === 'TECNICO' && user.id
      ? { ...EMPTY_FILTERS, tecnicoId: String(user.id) }
      : EMPTY_FILTERS,
  )
  const [technicians, setTechnicians] = useState<Technician[]>([])

  const {
    items,
    totalElements,
    totalPages,
    isLoading,
    isFetching,
    error,
  } = useServiceOrdersList(page, pageSize, filters)
  const {
    addServiceOrder,
    editServiceOrder,
    changeServiceOrderStatus,
    removeServiceOrder,
    isMutating,
    isChangingStatus,
  } = useServiceOrderMutations()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const serviceOrders = useMemo(() => mapServiceOrdersPageItems(items), [items])
  const filtersActive = hasActiveFilters(filters)
  const canDelete = canDeleteServiceOrders(user)
  const onlyMine = Boolean(user?.id && filters.tecnicoId === String(user.id))

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [detailOrder, setDetailOrder] = useState<ServiceOrder | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchTechnicians()
      .then((users) => {
        if (!cancelled) setTechnicians(users.map(mapTechnician))
      })
      .catch(() => {
        if (!cancelled) setTechnicians([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : error
          ? 'Não foi possível carregar as ordens de serviço.'
          : null

  const updateDraft = <K extends keyof ServiceOrderListFilters>(
    field: K,
    value: ServiceOrderListFilters[K],
  ) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    setFilters(draftFilters)
    setPage(0)
  }

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    setPage(0)
  }

  const toggleOnlyMine = () => {
    if (!user?.id) return
    const next = onlyMine
      ? { ...draftFilters, tecnicoId: '' }
      : { ...draftFilters, tecnicoId: String(user.id) }
    setDraftFilters(next)
    setFilters(next)
    setPage(0)
  }

  const openCreateModal = () => {
    setSelectedServiceOrder(null)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (serviceOrder: ServiceOrder) => {
    if (isServiceOrderLocked(serviceOrder.status)) {
      setSubmitError(
        serviceOrder.status === 'CANCELADO'
          ? 'OS cancelada não pode ser editada. Use “Reabrir orçamento”.'
          : 'Ordem de serviço concluída não pode mais ser alterada.',
      )
      return
    }
    setSelectedServiceOrder(serviceOrder)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const openDetailModal = async (serviceOrder: ServiceOrder) => {
    setIsDetailOpen(true)
    setDetailOrder(serviceOrder)
    setDetailError(null)
    setIsDetailLoading(true)

    try {
      const response = await fetchServiceOrder(serviceOrder.id)
      setDetailOrder(mapServiceOrder(response))
    } catch (err) {
      setDetailError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar os detalhes da ordem de serviço.',
      )
    } finally {
      setIsDetailLoading(false)
    }
  }

  const closeDetailModal = () => {
    setIsDetailOpen(false)
    setDetailOrder(null)
    setDetailError(null)
    setIsDetailLoading(false)
  }

  const handleSubmit = async (data: ServiceOrderFormData) => {
    setSubmitError(null)

    try {
      if (selectedServiceOrder) {
        if (isServiceOrderLocked(selectedServiceOrder.status)) {
          const message = 'Esta ordem de serviço não pode mais ser editada.'
          setSubmitError(message)
          throw new Error(message)
        }
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
      throw err instanceof Error ? err : new Error(message)
    }
  }

  const handleChangeStatus = async (
    serviceOrder: ServiceOrder,
    status: ServiceOrderStatus,
    confirmMessage?: string,
  ) => {
    if (confirmMessage) {
      const confirmed = await confirm({
        title: 'Alterar status',
        message: confirmMessage,
        confirmLabel: 'Confirmar',
        variant: status === 'CANCELADO' ? 'danger' : 'primary',
      })
      if (!confirmed) return
    }

    setSubmitError(null)
    try {
      const updated = await changeServiceOrderStatus(serviceOrder.id, status)
      if (detailOrder?.id === serviceOrder.id) {
        setDetailOrder(updated)
      }
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível alterar o status da ordem de serviço.',
      )
    }
  }

  const handleDelete = async (serviceOrder: ServiceOrder) => {
    if (!canDelete) {
      setSubmitError('Somente administradores podem excluir ordens de serviço.')
      return
    }
    if (isServiceOrderLocked(serviceOrder.status)) {
      setSubmitError('Ordens concluídas ou canceladas não podem ser excluídas.')
      return
    }

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
        <div className="page-header-actions">
          {user?.id && (
            <button
              type="button"
              className={`btn btn-sm ${onlyMine ? 'btn-primary' : 'btn-secondary'}`}
              onClick={toggleOnlyMine}
            >
              Minhas OS
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            + Nova OS
          </button>
        </div>
      </header>

      {errorMessage && <p className="page-error-banner">{errorMessage}</p>}
      {submitError && !isModalOpen && (
        <p className="page-error-banner">{submitError}</p>
      )}

      <div className="page-filters">
        <FormField
          label="Busca"
          id="os-filter-busca"
          type="search"
          value={draftFilters.busca ?? ''}
          onChange={(e) => updateDraft('busca', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyFilters()
          }}
          placeholder="Cliente, placa ou responsável"
        />

        <SelectField
          label="Status"
          id="os-filter-status"
          value={draftFilters.status ?? ''}
          onChange={(e) =>
            updateDraft('status', e.target.value as ServiceOrderStatus | '')
          }
        >
          <option value="">Todos</option>
          {SERVICE_ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {getServiceOrderStatusLabel(status)}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Responsável"
          id="os-filter-tecnico"
          value={draftFilters.tecnicoId ?? ''}
          onChange={(e) => updateDraft('tecnicoId', e.target.value)}
        >
          <option value="">Todos</option>
          {technicians.map((technician) => (
            <option key={technician.id} value={technician.id}>
              {technician.nome}
            </option>
          ))}
        </SelectField>

        <FormField
          label="Data início"
          id="os-filter-inicio"
          type="date"
          value={draftFilters.dataInicio ?? ''}
          onChange={(e) => updateDraft('dataInicio', e.target.value)}
        />

        <FormField
          label="Data fim"
          id="os-filter-fim"
          type="date"
          value={draftFilters.dataFim ?? ''}
          onChange={(e) => updateDraft('dataFim', e.target.value)}
        />

        <div className="page-filters-actions">
          <button type="button" className="btn btn-secondary" onClick={applyFilters}>
            Filtrar
          </button>
          {filtersActive && (
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <p>Carregando ordens de serviço...</p>
        </div>
      ) : serviceOrders.length === 0 ? (
        <div className="empty-state">
          <ClipboardList className="empty-icon" aria-hidden="true" />
          <h2>
            {filtersActive
              ? 'Nenhuma ordem encontrada'
              : 'Nenhuma ordem de serviço cadastrada'}
          </h2>
          <p>
            {filtersActive
              ? 'Ajuste os filtros ou limpe a busca para ver mais resultados.'
              : 'Comece registrando o primeiro atendimento da oficina.'}
          </p>
          {filtersActive ? (
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Limpar filtros
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              Nova OS
            </button>
          )}
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
                  <th>Responsável</th>
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
                      <div className="table-status-actions">
                        <ServiceOrderStatusActions
                          status={serviceOrder.status}
                          user={user}
                          disabled={isChangingStatus}
                          onChangeStatus={(status, confirmMessage) =>
                            void handleChangeStatus(serviceOrder, status, confirmMessage)
                          }
                        />
                      </div>
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
                          onClick={() => void openDetailModal(serviceOrder)}
                        >
                          <Eye aria-hidden="true" />
                          Ver
                        </button>
                        {!isServiceOrderLocked(serviceOrder.status) && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(serviceOrder)}
                          >
                            Editar
                          </button>
                        )}
                        {canDelete && !isServiceOrderLocked(serviceOrder.status) && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => void handleDelete(serviceOrder)}
                          >
                            Excluir
                          </button>
                        )}
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

      <ServiceOrderDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetailModal}
        serviceOrder={detailOrder}
        isLoading={isDetailLoading}
        error={detailError}
        statusHistorySource="staff"
        staffUser={user}
        isChangingStatus={isChangingStatus}
        onChangeStatus={
          detailOrder
            ? (status, confirmMessage) =>
                void handleChangeStatus(detailOrder, status, confirmMessage)
            : undefined
        }
      />

      <ServiceOrderFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedServiceOrder(null)
          setSubmitError(null)
        }}
        onSubmit={handleSubmit}
        isSubmitting={isMutating && !isChangingStatus}
        serviceOrder={selectedServiceOrder}
        submitError={submitError}
      />

      <ConfirmDialog />
    </div>
  )
}
