import logoFull from '../../assets/logo-vortex.webp'
import logoMark from '../../assets/logo-vortex-mark.webp'
import './Logo.css'

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'mobile'
  className?: string
}

const ALT_FULL = 'Vortex Mec - Sistema de Gerenciamento de Oficina'
const ALT_MARK = 'Vortex Mec'

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  const isMark = variant === 'icon'

  return (
    <img
      src={isMark ? logoMark : logoFull}
      alt={isMark ? ALT_MARK : ALT_FULL}
      className={`logo logo--${variant} ${className}`.trim()}
      decoding="async"
      draggable={false}
    />
  )
}
