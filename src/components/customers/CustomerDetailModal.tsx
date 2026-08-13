import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchServiceOrdersByCustomer } from '../../api/serviceOrders'
import { Modal } from '../ui/Modal'
import { ServiceOrderStatusBadge } from '../serviceOrders/ServiceOrderStatusBadge'
import '../serviceOrders/ServiceOrderStatusBadge.css'
import { ROUTES } from '../../routes/paths'
import { mapServiceOrder } from '../../types'
import type { Customer, ServiceOrder } from '../../types'
import { formatCustomerAddress } from '../../utils/address'
import { getSafeApiErrorMessage } from '../../utils/apiMessages'
import { formatCpfCnpj } from '../../utils/masks'
import {
  formatCurrency,
  formatServiceOrderDateTime,
} from '../../utils/serviceOrder'
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
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !customer) {
      setOrders([])
      setOrdersError(null)
      return
    }

    let cancelled = false
    setOrdersLoading(true)
    setOrdersError(null)

    fetchServiceOrdersByCustomer(customer.id)
      .then((data) => {
        if (cancelled) return
        const mapped = data
          .map(mapServiceOrder)
          .sort((a, b) => `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`))
        setOrders(mapped)
      })
      .catch((err) => {
        if (cancelled) return
        setOrders([])
        setOrdersError(
          getSafeApiErrorMessage(err, 'Não foi possível carregar as ordens de serviço.'),
        )
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, customer])

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

          <section className="customer-detail-section">
            <h3>Ordens de serviço</h3>
            {ordersLoading ? (
              <p className="customer-detail-orders-empty">Carregando histórico...</p>
            ) : ordersError ? (
              <p className="page-error-banner">{ordersError}</p>
            ) : orders.length === 0 ? (
              <p className="customer-detail-orders-empty">Nenhuma OS vinculada a este cliente.</p>
            ) : (
              <div className="customer-detail-orders">
                {orders.map((order) => (
                  <div key={order.id} className="customer-detail-order-row">
                    <div>
                      <strong>OS #{order.id}</strong>
                      <span>{formatServiceOrderDateTime(order.data, order.hora)}</span>
                    </div>
                    <ServiceOrderStatusBadge status={order.status} />
                    <strong>{formatCurrency(order.precoTotal)}</strong>
                    <Link
                      to={ROUTES.serviceOrders}
                      className="login-link"
                      onClick={onClose}
                    >
                      Ver na lista
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  )
}
