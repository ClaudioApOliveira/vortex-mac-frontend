import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZE_OPTIONS } from '../../constants/pagination'
import './Pagination.css'

interface PaginationProps {
  page: number
  pageSize: number
  totalElements: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  isLoading?: boolean
}

function getRangeLabel(page: number, pageSize: number, totalElements: number) {
  if (totalElements === 0) return 'Nenhum registro'

  const start = page * pageSize + 1
  const end = Math.min((page + 1) * pageSize, totalElements)
  return `${start}-${end} de ${totalElements}`
}

export function Pagination({
  page,
  pageSize,
  totalElements,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: PaginationProps) {
  if (totalElements === 0) return null

  const canGoPrevious = page > 0
  const canGoNext = totalPages > 0 && page < totalPages - 1

  return (
    <div className="pagination">
      <div className="pagination-info">
        <span>{getRangeLabel(page, pageSize, totalElements)}</span>
        {onPageSizeChange && (
          <label className="pagination-size">
            <span>Por página</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={isLoading}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious || isLoading}
        >
          <ChevronLeft aria-hidden="true" />
          Anterior
        </button>
        <span className="pagination-page">
          Página {page + 1} de {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext || isLoading}
        >
          Próxima
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
