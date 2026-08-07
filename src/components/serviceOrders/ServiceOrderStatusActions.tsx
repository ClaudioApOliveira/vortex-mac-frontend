import type { ServiceOrderStatus } from '../../api/types'
import type { User } from '../../types'
import { getServiceOrderStatusActions } from '../../utils/serviceOrderTransitions'
import './ServiceOrderStatusActions.css'

interface ServiceOrderStatusActionsProps {
  status: ServiceOrderStatus
  user: User | null
  disabled?: boolean
  size?: 'sm' | 'md'
  onChangeStatus: (status: ServiceOrderStatus, confirmMessage?: string) => void
}

export function ServiceOrderStatusActions({
  status,
  user,
  disabled = false,
  size = 'sm',
  onChangeStatus,
}: ServiceOrderStatusActionsProps) {
  const actions = getServiceOrderStatusActions(status, user)
  if (actions.length === 0) return null

  const sizeClass = size === 'sm' ? 'btn-sm' : ''

  return (
    <div className="service-order-status-actions">
      {actions.map((action) => (
        <button
          key={action.status}
          type="button"
          className={`btn ${sizeClass} ${
            action.variant === 'danger'
              ? 'btn-danger'
              : action.variant === 'primary'
                ? 'btn-primary'
                : 'btn-secondary'
          }`}
          disabled={disabled}
          onClick={() => onChangeStatus(action.status, action.confirm)}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
