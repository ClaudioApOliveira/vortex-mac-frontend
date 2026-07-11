import { useMemo, useState } from 'react'
import { ClipboardList, Eye } from 'lucide-react'
import { fetchMyServiceOrder } from '../api/auth'
import { ApiError } from '../api/errors'
import { ServiceOrderDetailModal } from '../components/serviceOrders/ServiceOrderDetailModal'
import { ServiceOrderStatusBadge } from '../components/serviceOrders/ServiceOrderStatusBadge'
import '../components/serviceOrders/ServiceOrderStatusBadge.css'
import { Pagination } from '../components/ui/Pagination'
import '../components/ui/Pagination.css'
import { DEFAULT_PAGE_SIZE } from '../constants/pagination'
import {
  useMyServiceOrderMutations,
  useMyServiceOrdersList,
} from '../hooks/useMyServiceOrders'
import { usePaginationState } from '../hooks/usePaginationState'
import { mapServiceOrder } from '../types'
import type { ServiceOrder } from '../types'
import { displayPlaca } from '../utils/masks'
import { formatCurrency, formatKm, formatServiceOrderDateTime } from '../utils/serviceOrder'
import './ClientServiceOrdersPage.css'

interface ServiceOrderCardProps {
  serviceOrder: ServiceOrder
  variant?: 'default' | 'pending'
  onOpen: (serviceOrder: ServiceOrder) => void
}

function ServiceOrderCard({
  serviceOrder,
  variant = 'default',
  onOpen,
}: ServiceOrderCardProps) {
  const isPending = serviceOrder.status === 'ORCAMENTO'

  return (
    <article
      className={`service-order-card${
        variant === 'pending' ? ' service-order-card--pending' : ''
      }`}
    >
      <div className="service-order-card-primary">
        <strong>{formatServiceOrderDateTime(serviceOrder.data, serviceOrder.hora)}</strong>
        <small>
          {serviceOrder.veiculoMarca} {serviceOrder.veiculoModelo}
        </small>
      </div>

      <div className="service-order-card-meta">
        <ServiceOrderStatusBadge status={serviceOrder.status} />
        <span className="plate-badge">{displayPlaca(serviceOrder.veiculoPlaca)}</span>
      </div>

      <div className="service-order-card-details">
        {isPending ? (
          <span>Revise os valores e aprove ou rejeite o orçamento</span>
        ) : (
          <span>
            Técnico: {serviceOrder.tecnicoNome} · KM saída: {formatKm(serviceOrder.kmSaida)}
          </span>
        )}
      </div>

      <div className="service-order-card-total">
        {formatCurrency(serviceOrder.precoTotal)}
      </div>

      <div className="service-order-card-action">
        <button
          type="button"
          className={`btn btn-sm service-order-card-button${
            isPending ? ' btn-primary' : ' btn-secondary'
          }`}
          onClick={() => onOpen(serviceOrder)}
        >
          <Eye aria-hidden="true" />
          {isPending ? 'Revisar e decidir' : 'Ver detalhes'}
        </button>
      </div>
    </article>
  )
}

export function ClientServiceOrdersPage() {
  const { page, pageSize, setPage, setPageSize } = usePaginationState(DEFAULT_PAGE_SIZE)
  const {
    items,
    totalElements,
    totalPages,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useMyServiceOrdersList(page, pageSize)
  const { approveMyServiceOrder, rejectMyServiceOrder, isDeciding } =
    useMyServiceOrderMutations()

  const serviceOrders = useMemo(() => items.map(mapServiceOrder), [items])
  const pendingOnPage = useMemo(
    () => serviceOrders.filter((order) => order.status === 'ORCAMENTO'),
    [serviceOrders],
  )

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [decisionError, setDecisionError] = useState<string | null>(null)

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : error
          ? 'Não foi possível carregar seu histórico de ordens de serviço.'
          : null

  const openDetails = async (serviceOrder: ServiceOrder) => {
    setSelectedOrderId(serviceOrder.id)
    setSelectedOrder(serviceOrder)
    setDetailError(null)
    setDecisionError(null)
    setIsDetailLoading(true)

    try {
      const response = await fetchMyServiceOrder(serviceOrder.id)
      setSelectedOrder(mapServiceOrder(response))
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar os detalhes da ordem de serviço.'
      setDetailError(message)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const closeDetails = () => {
    if (isDeciding) return
    setSelectedOrderId(null)
    setSelectedOrder(null)
    setDetailError(null)
    setDecisionError(null)
    setIsDetailLoading(false)
  }

  const handleApprove = async () => {
    if (!selectedOrder) return

    const confirmed = window.confirm(
      `Aprovar o orçamento da OS #${selectedOrder.id} no valor de ${formatCurrency(selectedOrder.precoTotal)}?`,
    )
    if (!confirmed) return

    setDecisionError(null)

    try {
      const response = await approveMyServiceOrder(selectedOrder.id)
      setSelectedOrder(mapServiceOrder(response))
      await refetch()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível aprovar o orçamento.'
      setDecisionError(message)
    }
  }

  const handleReject = async () => {
    if (!selectedOrder) return

    const confirmed = window.confirm(
      `Rejeitar o orçamento da OS #${selectedOrder.id}? Esta ação cancela o orçamento.`,
    )
    if (!confirmed) return

    setDecisionError(null)

    try {
      const response = await rejectMyServiceOrder(selectedOrder.id)
      setSelectedOrder(mapServiceOrder(response))
      await refetch()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível rejeitar o orçamento.'
      setDecisionError(message)
    }
  }

  return (
    <div className="page client-service-orders-page">
      <div className="client-service-orders-shell">
        <header className="page-header">
          <div>
            <h1>Meus atendimentos</h1>
            <p className="page-subtitle">
              Aprove orçamentos pendentes e acompanhe o histórico dos seus veículos
              {isFetching && !isLoading ? ' · Atualizando...' : ''}
            </p>
          </div>
        </header>

        {errorMessage && <p className="page-error-banner">{errorMessage}</p>}

        {isLoading ? (
          <div className="empty-state">
            <p>Carregando histórico...</p>
          </div>
        ) : serviceOrders.length === 0 ? (
          <div className="empty-state">
            <ClipboardList className="empty-icon" aria-hidden="true" />
            <h2>Nenhum atendimento registrado</h2>
            <p>Quando a oficina registrar uma ordem de serviço, ela aparecerá aqui.</p>
          </div>
        ) : (
          <section className="client-service-orders-section">
            {pendingOnPage.length > 0 && (
              <div className="client-service-orders-section-header">
                <h2>Orçamentos nesta página</h2>
                <span className="client-service-orders-count">{pendingOnPage.length}</span>
              </div>
            )}

            <div className="service-order-list">
              <div className="service-order-list-header" aria-hidden="true">
                <span>Atendimento</span>
                <span>Status</span>
                <span>Detalhes</span>
                <span>Total</span>
                <span>Ação</span>
              </div>

              {serviceOrders.map((serviceOrder) => (
                <ServiceOrderCard
                  key={serviceOrder.id}
                  serviceOrder={serviceOrder}
                  variant={serviceOrder.status === 'ORCAMENTO' ? 'pending' : 'default'}
                  onOpen={openDetails}
                />
              ))}
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
          </section>
        )}
      </div>

      <ServiceOrderDetailModal
        isOpen={selectedOrderId !== null}
        onClose={closeDetails}
        serviceOrder={selectedOrder}
        isLoading={isDetailLoading}
        error={detailError}
        canDecideBudget
        isDeciding={isDeciding}
        decisionError={decisionError}
        onApprove={() => void handleApprove()}
        onReject={() => void handleReject()}
        statusHistorySource="client"
      />
    </div>
  )
}
