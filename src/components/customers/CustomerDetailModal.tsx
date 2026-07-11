import { Modal } from '../ui/Modal'
import type { Customer } from '../../types'
import { formatCustomerAddress } from '../../utils/address'
import { formatCpfCnpj } from '../../utils/masks'
import './CustomerDetailModal.css'

interface CustomerDetailModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="customer-detail-item">
      <span>{label}</span>
      <strong>{value?.trim() ? value : '—'}</strong>
    </div>
  )
}

function formatDocument(customer: Customer) {
  const document = customer.cpf ?? customer.cnpj
  return document ? formatCpfCnpj(document) : undefined
}

export function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
}: CustomerDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer?.nome ?? 'Detalhes do cliente'}
      description="Consulte os dados completos do proprietário"
      size="lg"
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Fechar
        </button>
      }
    >
      {customer ? (
        <div className="customer-detail">
          <section className="customer-detail-section">
            <h3>Contato</h3>
            <div className="customer-detail-grid">
              <DetailItem label="E-mail" value={customer.email} />
              <DetailItem label="Telefone" value={customer.telefone} />
              <DetailItem label="CPF/CNPJ" value={formatDocument(customer)} />
              <DetailItem
                label="Cadastrado em"
                value={new Date(customer.criadoEm).toLocaleDateString('pt-BR')}
              />
            </div>
          </section>

          <section className="customer-detail-section">
            <h3>Endereço</h3>
            <div className="customer-detail-grid">
              <DetailItem label="CEP" value={customer.cep} />
              <DetailItem label="Logradouro" value={customer.logradouro} />
              <DetailItem label="Número" value={customer.numero} />
              <DetailItem label="Complemento" value={customer.complemento} />
              <DetailItem label="Bairro" value={customer.bairro} />
              <DetailItem
                label="Cidade"
                value={
                  customer.cidade && customer.uf
                    ? `${customer.cidade} - ${customer.uf}`
                    : customer.cidade
                }
              />
            </div>
            <p className="customer-detail-address">{formatCustomerAddress(customer)}</p>
          </section>
        </div>
      ) : null}
    </Modal>
  )
}
