import type { ServiceOrderStatus } from '../../api/types'
import { getServiceOrderStatusClass, getServiceOrderStatusLabel } from '../../utils/serviceOrder'

interface ServiceOrderStatusBadgeProps {
  status: ServiceOrderStatus
}

export function ServiceOrderStatusBadge({ status }: ServiceOrderStatusBadgeProps) {
  return (
    <span className={getServiceOrderStatusClass(status)}>
      {getServiceOrderStatusLabel(status)}
    </span>
  )
}
