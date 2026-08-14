import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { fetchMyServiceOrder } from '../../api/auth'
import { ApiError } from '../../api/errors'
import type { ServiceOrderStatus } from '../../api/types'
import { ServiceOrderStatusBadge } from '../../components/serviceOrders/ServiceOrderStatusBadge'
import '../../components/serviceOrders/ServiceOrderStatusBadge.css'
import { useAuth } from '../../contexts/AuthContext'
import { useMyServiceOrdersDashboard } from '../../hooks/useMyServiceOrders'
import { SERVICE_ORDER_STATUSES } from '../../schemas/serviceOrder.schema'
import { mapServiceOrder } from '../../types'
import type { ServiceOrder } from '../../types'
import { displayPlaca } from '../../utils/masks'
import { downloadServiceHistoryReportPdf } from '../../utils/pdf/serviceHistoryReportPdf'
import {
  formatCurrency,
  formatKm,
  formatServiceOrderDateTime,
  getServiceOrderStatusLabel,
} from '../../utils/serviceOrder'
import { FormField } from '../../components/ui/FormField'
import { SelectField } from '../../components/ui/SelectField'
import '../customers/CustomersPage.css'
import './pageFilters.css'
import './ClientReportsPage.css'

type StatusFilter = ServiceOrderStatus | ''

export function ClientReportsPage() {
  const { user } = useAuth()
  const { serviceOrders, isLoading, error } = useMyServiceOrdersDashboard()
  const [veiculoKey, setVeiculoKey] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [detailsById, setDetailsById] = useState<Record<number, ServiceOrder>>({})
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null)
  const [detailErrorById, setDetailErrorById] = useState<Record<number, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const vehicleOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const order of serviceOrders) {
      const key = String(order.veiculoId)
      if (!map.has(key)) {
        map.set(
          key,
          `${displayPlaca(order.veiculoPlaca)} — ${order.veiculoMarca} ${order.veiculoModelo}`,
        )
      }
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }))
  }, [serviceOrders])

  const filteredOrders = useMemo(() => {
    const veiculoId = veiculoKey ? Number(veiculoKey) : null
    const filtered = serviceOrders.filter((order) => {
      if (status && order.status !== status) return false
      if (veiculoId != null && order.veiculoId !== veiculoId) return false
      if (dataInicio && order.data < dataInicio) return false
      if (dataFim && order.data > dataFim) return false
      return true
    })

    return filtered.sort((a, b) => {
      const aKey = `${a.data}T${a.hora}`
      const bKey = `${b.data}T${b.hora}`
      return bKey.localeCompare(aKey)
    })
  }, [serviceOrders, veiculoKey, dataInicio, dataFim, status])

  const totalPeriodo = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + order.precoTotal, 0),
    [filteredOrders],
  )

  const mediaPeriodo = useMemo(
    () => (filteredOrders.length > 0 ? totalPeriodo / filteredOrders.length : 0),
    [filteredOrders.length, totalPeriodo],
  )

  const statusBreakdown = useMemo(() => {
    const counts = new Map<ServiceOrderStatus, number>()
    for (const order of filteredOrders) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1)
    }
    return SERVICE_ORDER_STATUSES.filter((item) => (counts.get(item) ?? 0) > 0).map((item) => ({
      status: item,
      count: counts.get(item) ?? 0,
    }))
  }, [filteredOrders])

  useEffect(() => {
    setExpandedId(null)
  }, [veiculoKey, dataInicio, dataFim, status])

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : error
          ? 'Não foi possível carregar o histórico de serviços.'
          : null

  const loadOrderDetail = async (orderId: number) => {
    if (detailsById[orderId] || loadingDetailId === orderId) return

    setLoadingDetailId(orderId)
    setDetailErrorById((prev) => {
      const next = { ...prev }
      delete next[orderId]
      return next
    })

    try {
      const response = await fetchMyServiceOrder(orderId)
      setDetailsById((prev) => ({ ...prev, [orderId]: mapServiceOrder(response) }))
    } catch (err) {
      setDetailErrorById((prev) => ({
        ...prev,
        [orderId]:
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar o detalhe desta OS.',
      }))
    } finally {
      setLoadingDetailId(null)
    }
  }

  const toggleExpand = (order: ServiceOrder) => {
    if (expandedId === order.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(order.id)
    void loadOrderDetail(order.id)
  }

  const handleGenerate = async () => {
    setGenerateError(null)

    if (!user) {
      setGenerateError('Sessão inválida. Faça login novamente.')
      return
    }

    if (filteredOrders.length === 0) {
      setGenerateError('Não há ordens de serviço para gerar o relatório com os filtros atuais.')
      return
    }

    setIsGenerating(true)

    try {
      const detailedOrders: ServiceOrder[] = []

      for (const order of filteredOrders) {
        if (detailsById[order.id]) {
          detailedOrders.push(detailsById[order.id])
          continue
        }

        try {
          const response = await fetchMyServiceOrder(order.id)
          const mapped = mapServiceOrder(response)
          setDetailsById((prev) => ({ ...prev, [order.id]: mapped }))
          detailedOrders.push(mapped)
        } catch {
          detailedOrders.push(order)
        }
      }

      const selectedVehicle = vehicleOptions.find((option) => option.value === veiculoKey)
      downloadServiceHistoryReportPdf({
        clientName: user.nome,
        orders: detailedOrders,
        vehicleLabel: selectedVehicle?.label,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        statusLabel: status ? getServiceOrderStatusLabel(status) : 'Todos',
      })
    } catch {
      setGenerateError('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Relatórios</h1>
          <p className="page-subtitle">
            Veja o resumo das suas OS na tela e, se quiser, baixe o PDF detalhado
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void handleGenerate()}
          disabled={isLoading || isGenerating || filteredOrders.length === 0}
        >
          <FileText aria-hidden="true" />
          {isGenerating ? 'Gerando PDF...' : 'Baixar PDF'}
        </button>
      </header>

      {errorMessage && <p className="page-error-banner">{errorMessage}</p>}
      {generateError && <p className="page-error-banner">{generateError}</p>}

      <section className="client-reports-panel">
        <div className="page-filters client-reports-filters">
          <SelectField
            label="Veículo"
            id="report-veiculo"
            value={veiculoKey}
            onChange={(e) => setVeiculoKey(e.target.value)}
            disabled={isLoading || isGenerating}
          >
            <option value="">Todos os veículos</option>
            {vehicleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Status"
            id="report-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            disabled={isLoading || isGenerating}
          >
            <option value="">Todos</option>
            {SERVICE_ORDER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {getServiceOrderStatusLabel(item)}
              </option>
            ))}
          </SelectField>

          <FormField
            label="Data início"
            id="report-inicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            disabled={isLoading || isGenerating}
          />

          <FormField
            label="Data fim"
            id="report-fim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            disabled={isLoading || isGenerating}
          />
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p>Carregando histórico...</p>
          </div>
        ) : (
          <>
            <div className="client-reports-summary client-reports-summary--3">
              <div>
                <span>Ordens no filtro</span>
                <strong>{filteredOrders.length}</strong>
              </div>
              <div>
                <span>Total no período</span>
                <strong>{formatCurrency(totalPeriodo)}</strong>
              </div>
              <div>
                <span>Ticket médio</span>
                <strong>{formatCurrency(mediaPeriodo)}</strong>
              </div>
            </div>

            {statusBreakdown.length > 0 && (
              <div className="client-reports-status-row">
                {statusBreakdown.map((item) => (
                  <div key={item.status} className="client-reports-status-chip">
                    <ServiceOrderStatusBadge status={item.status} />
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            )}

            {filteredOrders.length === 0 ? (
              <div className="empty-state">
                <FileText className="empty-icon" aria-hidden="true" />
                <h2>Nenhuma OS encontrada</h2>
                <p>Ajuste os filtros para visualizar o resumo das suas ordens.</p>
              </div>
            ) : (
              <div className="client-reports-list">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedId === order.id
                  const detail = detailsById[order.id]
                  const detailError = detailErrorById[order.id]
                  const isLoadingDetail = loadingDetailId === order.id

                  return (
                    <article
                      key={order.id}
                      className={`client-report-card${isExpanded ? ' client-report-card--open' : ''}`}
                    >
                      <button
                        type="button"
                        className="client-report-card-header"
                        onClick={() => toggleExpand(order)}
                        aria-expanded={isExpanded}
                      >
                        <div className="client-report-card-main">
                          <strong>OS #{order.id}</strong>
                          <span>{formatServiceOrderDateTime(order.data, order.hora)}</span>
                        </div>
                        <div className="client-report-card-meta">
                          <ServiceOrderStatusBadge status={order.status} />
                          <span className="plate-badge">{displayPlaca(order.veiculoPlaca)}</span>
                          <strong className="client-report-card-total">
                            {formatCurrency(order.precoTotal)}
                          </strong>
                          <ChevronDown
                            className="client-report-card-chevron"
                            aria-hidden="true"
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="client-report-card-body">
                          {isLoadingDetail ? (
                            <p className="client-report-card-loading">Carregando detalhes...</p>
                          ) : detailError ? (
                            <p className="page-error-banner">{detailError}</p>
                          ) : detail ? (
                            <>
                              <div className="client-report-detail-grid">
                                <div>
                                  <span>Veículo</span>
                                  <strong>
                                    {detail.veiculoMarca} {detail.veiculoModelo}
                                  </strong>
                                </div>
                                <div>
                                  <span>Responsável</span>
                                  <strong>{detail.tecnicoNome}</strong>
                                </div>
                                <div>
                                  <span>KM entrada</span>
                                  <strong>{formatKm(detail.kmEntrada)}</strong>
                                </div>
                                <div>
                                  <span>KM saída</span>
                                  <strong>{formatKm(detail.kmSaida)}</strong>
                                </div>
                              </div>

                              {detail.diagnosticoInicial?.trim() && (
                                <div className="client-report-block">
                                  <h3>Diagnóstico</h3>
                                  <p>{detail.diagnosticoInicial}</p>
                                </div>
                              )}

                              <div className="client-report-block">
                                <h3>Peças</h3>
                                {detail.itens.length === 0 ? (
                                  <p>Nenhuma peça registrada.</p>
                                ) : (
                                  <ul className="client-report-items">
                                    {detail.itens.map((item) => (
                                      <li key={item.id ?? `${item.descricao}-${item.valorTotal}`}>
                                        <span>
                                          {item.descricao}{' '}
                                          <small>
                                            ({item.quantidade.toLocaleString('pt-BR')} ×{' '}
                                            {formatCurrency(item.valorUnitario)})
                                          </small>
                                        </span>
                                        <strong>{formatCurrency(item.valorTotal)}</strong>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div className="client-report-totals">
                                <div>
                                  <span>Serviços terceirizados</span>
                                  <strong>
                                    {formatCurrency(detail.custoServicosTerceirizados)}
                                  </strong>
                                </div>
                                <div>
                                  <span>Peças</span>
                                  <strong>{formatCurrency(detail.custoPecas)}</strong>
                                </div>
                                <div>
                                  <span>Mão de obra</span>
                                  <strong>{formatCurrency(detail.custoMaoDeObra)}</strong>
                                </div>
                                <div className="client-report-totals-final">
                                  <span>Total</span>
                                  <strong>{formatCurrency(detail.precoTotal)}</strong>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="client-report-card-loading">Sem detalhes disponíveis.</p>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
