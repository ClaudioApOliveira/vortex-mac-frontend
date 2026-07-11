import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './Modal.css'

export type ModalSize = 'md' | 'lg' | 'xl'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  preventClose?: boolean
  bodyClassName?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  preventClose = false,
  bodyClassName,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) onClose()
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, preventClose])

  if (!isOpen) return null

  const handleOverlayClick = () => {
    if (!preventClose) onClose()
  }

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick} role="presentation">
      <div
        className={`modal-content modal-content--${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
      >
        <header className="modal-header">
          <div className="modal-header-text">
            <h2 id="modal-title">{title}</h2>
            {description && (
              <p id="modal-description" className="modal-description">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={preventClose}
            aria-label="Fechar"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className={['modal-body', bodyClassName].filter(Boolean).join(' ')}>
          {children}
        </div>

        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
