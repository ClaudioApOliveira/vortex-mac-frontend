import logo from '../../assets/logo-vortex.png'
import './Logo.css'

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'mobile'
  className?: string
}

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  return (
    <img
      src={logo}
      alt="Vortex Mec - Sistema de Gerenciamento de Oficina"
      className={`logo logo--${variant} ${className}`.trim()}
    />
  )
}
