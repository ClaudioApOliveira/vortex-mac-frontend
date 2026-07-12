import { useCallback, useState, type ReactNode } from 'react'
import { Modal } from '../components/ui/Modal'

export interface ConfirmDialogOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
}

interface ConfirmState extends ConfirmDialogOptions {
  resolve: (confirmed: boolean) => void
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve })
    })
  }, [])

  const close = useCallback((confirmed: boolean) => {
    setState((current) => {
      current?.resolve(confirmed)
      return null
    })
  }, [])

  const ConfirmDialog = useCallback(() => {
    if (!state) return null

    const confirmVariant = state.variant ?? 'danger'
    const confirmClassName =
      confirmVariant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'

    return (
      <Modal
        isOpen
        onClose={() => close(false)}
        title={state.title}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => close(false)}>
              {state.cancelLabel ?? 'Cancelar'}
            </button>
            <button
              type="button"
              className={confirmClassName}
              onClick={() => close(true)}
            >
              {state.confirmLabel ?? 'Confirmar'}
            </button>
          </>
        }
      >
        <p className="confirm-dialog-message">{state.message}</p>
      </Modal>
    )
  }, [close, state])

  return { confirm, ConfirmDialog }
}
