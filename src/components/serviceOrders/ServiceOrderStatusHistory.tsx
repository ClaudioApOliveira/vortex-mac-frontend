import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ServiceOrderStatusHistoryResponse } from '../../api/types'
import {
  formatDateTime,
  formatServiceOrderStatusHistoryEntry,
  getServiceOrderStatusHistoryOriginLabel,
} from '../../utils/serviceOrder'
import './ServiceOrderStatusHistory.css'

interface ServiceOrderStatusHistoryProps {
  entries: ServiceOrderStatusHistoryResponse[]
  isLoading?: boolean
  error?: string | null
  title?: string
  defaultCollapsed?: boolean
}

export function ServiceOrderStatusHistory({
  entries,
  isLoading = false,
  error = null,
  title = 'Histórico de status',
  defaultCollapsed = false,
}: ServiceOrderStatusHistoryProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const toggleCollapsed = () => {
    setIsCollapsed((current) => !current)
  }

  const renderContent = () => {
    if (isLoading) {
      return <p className="service-order-status-history-loading">Carregando histórico...</p>
    }

    if (error) {
      return <p className="page-error-banner">{error}</p>
    }

    if (entries.length === 0) {
      return (
        <p className="service-order-status-history-empty">
          Nenhuma alteração de status registrada ainda.
        </p>
      )
    }

    return (
      <div className="service-order-status-history">
        {entries.map((entry) => (
          <article key={entry.id} className="service-order-status-history-item">
            <div className="service-order-status-history-main">
              <strong>
                {formatServiceOrderStatusHistoryEntry(entry.statusAnterior, entry.statusNovo)}
              </strong>
              <span>{formatDateTime(entry.criadoEm)}</span>
            </div>
            <div className="service-order-status-history-meta">
              <span>{entry.usuarioNome ?? 'Usuário não identificado'}</span>
              <span>{getServiceOrderStatusHistoryOriginLabel(entry.origem)}</span>
            </div>
            {entry.observacao && <p>{entry.observacao}</p>}
          </article>
        ))}
      </div>
    )
  }

  return (
    <section className="service-order-status-history-section">
      <button
        type="button"
        className="service-order-status-history-toggle"
        onClick={toggleCollapsed}
        aria-expanded={!isCollapsed}
        aria-controls="service-order-status-history-content"
      >
        <span className="service-order-status-history-toggle-label">{title}</span>
        {!isLoading && entries.length > 0 && (
          <span className="service-order-status-history-count">{entries.length}</span>
        )}
        <ChevronDown
          className={`service-order-status-history-chevron${
            isCollapsed ? ' service-order-status-history-chevron--collapsed' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {!isCollapsed && (
        <div
          id="service-order-status-history-content"
          className="service-order-status-history-content"
        >
          {renderContent()}
        </div>
      )}
    </section>
  )
}
