import { useEffect, useState } from 'react'
import { FileDown } from 'lucide-react'
import { fetchMyServiceOrderStatusHistory } from '../../api/auth'
import { fetchServiceOrderStatusHistory } from '../../api/serviceOrders'
import { ApiError } from '../../api/errors'
import type { ServiceOrderStatus, ServiceOrderStatusHistoryResponse } from '../../api/types'
import type { ServiceOrder, User } from '../../types'
import { displayPlaca } from '../../utils/masks'
import { downloadServiceOrderBudgetPdf } from '../../utils/pdf/serviceOrderBudgetPdf'
import {
  formatCurrency,
  formatKm,
  formatServiceOrderDateTime,
} from '../../utils/serviceOrder'
import { Modal } from '../ui/Modal'
import { ServiceOrderStatusActions } from './ServiceOrderStatusActions'
import { ServiceOrderStatusBadge } from './ServiceOrderStatusBadge'
import './ServiceOrderStatusBadge.css'
import { ServiceOrderStatusHistory } from './ServiceOrderStatusHistory'
import './ServiceOrderStatusHistory.css'
import './ServiceOrderDetailModal.css'
import '../../pages/customers/CustomersPage.css'

interface ServiceOrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  serviceOrder: ServiceOrder | null
  isLoading?: boolean
  error?: string | null
  canDecideBudget?: boolean
  isDeciding?: boolean
  decisionError?: string | null
  onApprove?: () => void
  onReject?: () => void
  statusHistorySource?: 'client' | 'staff' | null
  staffUser?: User | null
  isChangingStatus?: boolean
  onChangeStatus?: (status: ServiceOrderStatus, confirmMessage?: string) => void
}

export function ServiceOrderDetailModal({
  isOpen,
  onClose,
  serviceOrder,
  isLoading = false,
  error = null,
  canDecideBudget = false,
  isDeciding = false,
  decisionError = null,
  onApprove,
  onReject,
  statusHistorySource = null,
  staffUser = null,
  isChangingStatus = false,
  onChangeStatus,
}: ServiceOrderDetailModalProps) {
  const showBudgetActions = canDecideBudget && serviceOrder?.status === 'ORCAMENTO'
  const canDownloadBudgetPdf = Boolean(serviceOrder) && !isLoading && !error
  const showStaffStatusActions =
    statusHistorySource === 'staff' && Boolean(serviceOrder) && Boolean(onChangeStatus)
  const [statusHistory, setStatusHistory] = useState<ServiceOrderStatusHistoryResponse[]>([])
  const [isLoadingStatusHistory, setIsLoadingStatusHistory] = useState(false)
  const [statusHistoryError, setStatusHistoryError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !serviceOrder?.id || !statusHistorySource) {
      setStatusHistory([])
      setStatusHistoryError(null)
      return
    }

    let cancelled = false
    setIsLoadingStatusHistory(true)
    setStatusHistoryError(null)

    const fetchHistory =
      statusHistorySource === 'client'
        ? fetchMyServiceOrderStatusHistory
        : fetchServiceOrderStatusHistory

    fetchHistory(serviceOrder.id)
      .then((data) => {
        if (!cancelled) setStatusHistory(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setStatusHistory([])
          setStatusHistoryError(
            err instanceof ApiError
              ? err.message
              : 'Não foi possível carregar o histórico de status.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStatusHistory(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, serviceOrder?.id, serviceOrder?.status, statusHistorySource])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={serviceOrder ? `OS #${serviceOrder.id}` : 'Detalhes da ordem de serviço'}
      description={
        serviceOrder
          ? formatServiceOrderDateTime(serviceOrder.data, serviceOrder.hora)
          : 'Consulte os serviços realizados na oficina'
      }
      size="xl"
      preventClose={isDeciding || isChangingStatus}
      footer={
        <div className="service-order-detail-footer">
          {canDownloadBudgetPdf && serviceOrder && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => downloadServiceOrderBudgetPdf(serviceOrder)}
              disabled={isDeciding || isChangingStatus}
            >
              <FileDown aria-hidden="true" />
              Baixar / imprimir orçamento
            </button>
          )}
          {showBudgetActions && (
            <>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onReject}
                disabled={isDeciding}
              >
                {isDeciding ? 'Processando...' : 'Rejeitar orçamento'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onApprove}
                disabled={isDeciding}
              >
                {isDeciding ? 'Processando...' : 'Aprovar orçamento'}
              </button>
            </>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeciding || isChangingStatus}
          >
            Fechar
          </button>
        </div>
      }
    >
      {isLoading ? (
        <p className="service-order-detail-loading">Carregando detalhes...</p>
      ) : error ? (
        <p className="page-error-banner">{error}</p>
      ) : serviceOrder ? (
        <div className="service-order-detail">
          {showBudgetActions && (
            <div className="service-order-budget-banner">
              <strong>Orçamento aguardando sua aprovação</strong>
              <p>
                Revise os itens e o valor total. Você pode baixar o PDF para assinar e
                entregar na oficina, ou aprovar/rejeitar digitalmente abaixo.
              </p>
            </div>
          )}

          {showStaffStatusActions && (
            <div className="service-order-staff-actions">
              <strong>Avançar atendimento</strong>
              <ServiceOrderStatusActions
                status={serviceOrder.status}
                user={staffUser}
                size="md"
                disabled={isChangingStatus}
                onChangeStatus={(status, confirmMessage) =>
                  onChangeStatus?.(status, confirmMessage)
                }
              />
            </div>
          )}

          {decisionError && <p className="page-error-banner">{decisionError}</p>}

          <section className="service-order-detail-grid">
            <article className="service-order-detail-card">
              <h3>Veículo</h3>
              <p>
                <span className="plate-badge">{displayPlaca(serviceOrder.veiculoPlaca)}</span>
              </p>
              <p>
                {serviceOrder.veiculoMarca} {serviceOrder.veiculoModelo}
              </p>
            </article>

            <article className="service-order-detail-card">
              <h3>Atendimento</h3>
              <p>
                <strong>Status:</strong>{' '}
                <ServiceOrderStatusBadge status={serviceOrder.status} />
              </p>
              <p>
                <strong>Responsável:</strong> {serviceOrder.tecnicoNome}
              </p>
              <p>
                <strong>KM entrada:</strong> {formatKm(serviceOrder.kmEntrada)}
              </p>
              <p>
                <strong>KM saída:</strong> {formatKm(serviceOrder.kmSaida)}
              </p>
            </article>
          </section>

          {serviceOrder.diagnosticoInicial && (
            <section className="service-order-detail-diagnosis">
              <h3>Diagnóstico</h3>
              <p>{serviceOrder.diagnosticoInicial}</p>
            </section>
          )}

          <section className="service-order-detail-items">
            <h3>Itens da ordem</h3>
            {serviceOrder.itens.length === 0 ? (
              <p className="service-order-detail-empty">Nenhum item registrado.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Qtd.</th>
                      <th>Valor unit.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceOrder.itens.map((item) => (
                      <tr key={item.id ?? item.descricao}>
                        <td>{item.descricao}</td>
                        <td>{item.quantidade.toLocaleString('pt-BR')}</td>
                        <td>{formatCurrency(item.valorUnitario)}</td>
                        <td>
                          <strong>{formatCurrency(item.valorTotal)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="service-order-detail-totals">
            <div>
              <span>Serviços terceirizados</span>
              <strong>{formatCurrency(serviceOrder.custoServicosTerceirizados)}</strong>
              {serviceOrder.descricaoServicosTerceirizados && (
                <small>{serviceOrder.descricaoServicosTerceirizados}</small>
              )}
            </div>
            <div>
              <span>Peças</span>
              <strong>{formatCurrency(serviceOrder.custoPecas)}</strong>
            </div>
            <div>
              <span>Mão de obra</span>
              <strong>{formatCurrency(serviceOrder.custoMaoDeObra)}</strong>
              {serviceOrder.descricaoMaoDeObra && (
                <small>{serviceOrder.descricaoMaoDeObra}</small>
              )}
            </div>
            <div className="service-order-detail-total">
              <span>Total</span>
              <strong>{formatCurrency(serviceOrder.precoTotal)}</strong>
            </div>
          </section>

          {statusHistorySource && (
            <ServiceOrderStatusHistory
              entries={statusHistory}
              isLoading={isLoadingStatusHistory}
              error={statusHistoryError}
            />
          )}
        </div>
      ) : null}
    </Modal>
  )
}
