import { useEffect, useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { fetchServiceOrdersPage, type ServiceOrderListFilters } from '../../api/serviceOrders'
import { fetchTechnicians } from '../../api/technicians'
import type { ServiceOrderStatus } from '../../api/types'
import { ServiceOrderStatusBadge } from '../../components/serviceOrders/ServiceOrderStatusBadge'
import '../../components/serviceOrders/ServiceOrderStatusBadge.css'
import { SERVICE_ORDER_STATUSES } from '../../schemas/serviceOrder.schema'
import { mapServiceOrder, mapTechnician } from '../../types'
import type { ServiceOrder, Technician } from '../../types'
import { getSafeApiErrorMessage } from '../../utils/apiMessages'
import { downloadOfficeReportPdf } from '../../utils/pdf/officeReportPdf'
import {
  formatCurrency,
  formatServiceOrderDateTime,
  getServiceOrderStatusLabel,
} from '../../utils/serviceOrder'
import '../customers/CustomersPage.css'
import './pageFilters.css'
import './ClientReportsPage.css'

type StatusFilter = ServiceOrderStatus | ''

const REPORT_PAGE_SIZE = 200

export function OfficeReportsPage() {
  const [status, setStatus] = useState<StatusFilter>('')
  const [tecnicoId, setTecnicoId] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [applied, setApplied] = useState<ServiceOrderListFilters>({})
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchTechnicians()
      .then((data) => {
        if (!cancelled) setTechnicians(data.map(mapTechnician))
      })
      .catch(() => {
        if (!cancelled) setTechnicians([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    async function loadAll() {
      const first = await fetchServiceOrdersPage(0, REPORT_PAGE_SIZE, applied)
      let items = first.content.map(mapServiceOrder)
      const totalPages = first.totalPages ?? 1
      for (let page = 1; page < totalPages && page < 10; page++) {
        const next = await fetchServiceOrdersPage(page, REPORT_PAGE_SIZE, applied)
        items = items.concat(next.content.map(mapServiceOrder))
      }
      return items
    }

    loadAll()
      .then((items) => {
        if (!cancelled) setOrders(items)
      })
      .catch((err) => {
        if (!cancelled) {
          setOrders([])
          setError(getSafeApiErrorMessage(err, 'Não foi possível carregar o relatório.'))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [applied])

  const faturamento = useMemo(
    () =>
      orders
        .filter((order) => order.status === 'CONCLUIDO')
        .reduce((sum, order) => sum + order.precoTotal, 0),
    [orders],
  )

  const byStatus = useMemo(() => {
    const counts = new Map<ServiceOrderStatus, number>()
    for (const order of orders) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1)
    }
    return SERVICE_ORDER_STATUSES.map((statusItem) => ({
      status: statusItem,
      label: getServiceOrderStatusLabel(statusItem),
      count: counts.get(statusItem) ?? 0,
    })).filter((row) => row.count > 0)
  }, [orders])

  const byResponsible = useMemo(() => {
    const map = new Map<string, { name: string; count: number; total: number }>()
    for (const order of orders) {
      const key = String(order.tecnicoId)
      const current = map.get(key) ?? { name: order.tecnicoNome, count: 0, total: 0 }
      current.count += 1
      current.total += order.precoTotal
      map.set(key, current)
    }
    return [...map.values()].sort((a, b) => b.total - a.total)
  }, [orders])

  const responsibleLabel = technicians.find((t) => String(t.id) === tecnicoId)?.nome

  const applyFilters = () => {
    setApplied({
      status: status || undefined,
      tecnicoId: tecnicoId || undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
    })
  }

  const clearFilters = () => {
    setStatus('')
    setTecnicoId('')
    setDataInicio('')
    setDataFim('')
    setApplied({})
  }

  const handlePdf = () => {
    setIsGenerating(true)
    try {
      downloadOfficeReportPdf({
        orders,
        faturamento,
        byStatus: byStatus.map((row) => ({ status: row.label, count: row.count })),
        byResponsible,
        dataInicio: applied.dataInicio,
        dataFim: applied.dataFim,
        statusLabel: applied.status ? getServiceOrderStatusLabel(applied.status) : undefined,
        responsibleLabel,
      })
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
            Faturamento, OS por status e por responsável
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isLoading || orders.length === 0 || isGenerating}
          onClick={handlePdf}
        >
          <FileText aria-hidden="true" />
          {isGenerating ? 'Gerando...' : 'Gerar PDF'}
        </button>
      </header>

      {error && <p className="page-error-banner">{error}</p>}

      <div className="client-reports-panel">
        <div className="page-filters client-reports-filters">
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
              <option value="">Todos</option>
              {SERVICE_ORDER_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {getServiceOrderStatusLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsável
            <select value={tecnicoId} onChange={(e) => setTecnicoId(e.target.value)}>
              <option value="">Todos</option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data início
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </label>
          <label>
            Data fim
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </label>
          <div className="page-filters-actions">
            <button type="button" className="btn btn-primary" onClick={applyFilters}>
              Filtrar
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Limpar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p>Carregando relatório...</p>
          </div>
        ) : (
          <>
            <div className="client-reports-summary client-reports-summary--3">
              <div>
                <span>OS no filtro</span>
                <strong>{orders.length}</strong>
              </div>
              <div>
                <span>Faturamento (concluídas)</span>
                <strong>{formatCurrency(faturamento)}</strong>
              </div>
              <div>
                <span>Ticket médio (concluídas)</span>
                <strong>
                  {formatCurrency(
                    orders.filter((o) => o.status === 'CONCLUIDO').length > 0
                      ? faturamento /
                          orders.filter((o) => o.status === 'CONCLUIDO').length
                      : 0,
                  )}
                </strong>
              </div>
            </div>

            <div className="client-reports-status-row">
              {byStatus.map((row) => (
                <div key={row.status} className="client-reports-status-chip">
                  <ServiceOrderStatusBadge status={row.status} />
                  <strong>{row.count}</strong>
                </div>
              ))}
            </div>

            {byResponsible.length > 0 && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Responsável</th>
                      <th>OS</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byResponsible.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td>{row.count}</td>
                        <td>{formatCurrency(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {orders.length === 0 ? (
              <div className="empty-state">
                <FileText className="empty-icon" aria-hidden="true" />
                <h2>Nenhuma OS no período</h2>
                <p>Ajuste os filtros para gerar o relatório.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>OS</th>
                      <th>Data</th>
                      <th>Cliente</th>
                      <th>Status</th>
                      <th>Responsável</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{formatServiceOrderDateTime(order.data, order.hora)}</td>
                        <td>{order.clienteNome}</td>
                        <td>
                          <ServiceOrderStatusBadge status={order.status} />
                        </td>
                        <td>{order.tecnicoNome}</td>
                        <td>{formatCurrency(order.precoTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
