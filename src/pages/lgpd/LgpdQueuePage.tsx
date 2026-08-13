import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { CustomerDetailModal } from '../../components/customers/CustomerDetailModal'
import { useConfirmDialog } from '../../hooks/useConfirmDialog'
import { useLgpdDeletionRequests } from '../../hooks/useLgpdDeletionRequests'
import type { Customer } from '../../types'
import { getSafeApiErrorMessage } from '../../utils/apiMessages'
import { formatCpfCnpj } from '../../utils/masks'
import { formatDateTime } from '../../utils/serviceOrder'
import '../customers/CustomersPage.css'

export function LgpdQueuePage() {
  const { requests, isLoading, error, anonymize, isAnonymizing } = useLgpdDeletionRequests()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const handleAnonymize = async (customer: Customer) => {
    const confirmed = await confirm({
      title: 'Anonimizar dados (LGPD)',
      message: `Anonimizar os dados pessoais de ${customer.nome}? CPF, telefone, endereço e e-mail serão removidos. O histórico de OS é mantido sem identificação.`,
      confirmLabel: 'Anonimizar',
      variant: 'danger',
    })
    if (!confirmed) return

    setActionError(null)
    setActionSuccess(null)
    try {
      await anonymize(customer.id)
      setActionSuccess(`Dados de ${customer.nome} anonimizados.`)
      if (detailCustomer?.id === customer.id) setDetailCustomer(null)
    } catch (err) {
      setActionError(getSafeApiErrorMessage(err, 'Não foi possível anonimizar o cliente.'))
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Solicitações LGPD</h1>
          <p className="page-subtitle">
            Fila de exclusão/anonimização solicitada pelos clientes
          </p>
        </div>
      </header>

      {error && <p className="page-error-banner">{error}</p>}
      {actionError && <p className="page-error-banner">{actionError}</p>}
      {actionSuccess && <p className="page-warning-banner">{actionSuccess}</p>}

      {isLoading ? (
        <div className="empty-state">
          <p>Carregando solicitações...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <ShieldAlert className="empty-icon" aria-hidden="true" />
          <h2>Nenhuma solicitação pendente</h2>
          <p>Quando um cliente pedir exclusão no perfil, ela aparecerá aqui.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Solicitado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.nome}</strong>
                    <div className="customer-lgpd-flag">Exclusão solicitada</div>
                  </td>
                  <td>
                    {customer.cpf ?? customer.cnpj
                      ? formatCpfCnpj(customer.cpf ?? customer.cnpj ?? '')
                      : '—'}
                  </td>
                  <td>
                    {customer.lgpdExclusaoSolicitadaEm
                      ? formatDateTime(customer.lgpdExclusaoSolicitadaEm)
                      : '—'}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setDetailCustomer(customer)}
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={isAnonymizing}
                        onClick={() => void handleAnonymize(customer)}
                      >
                        Anonimizar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerDetailModal
        isOpen={detailCustomer != null}
        onClose={() => setDetailCustomer(null)}
        customer={detailCustomer}
      />
      <ConfirmDialog />
    </div>
  )
}
