import { Car, ClipboardList, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCustomers } from '../hooks/useCustomers'
import { useVehicles } from '../hooks/useVehicles'
import { useMyServiceOrdersDashboard } from '../hooks/useMyServiceOrders'
import { useServiceOrdersSummary } from '../hooks/useServiceOrders'
import { ROUTES } from '../routes/paths'
import { formatCustomerAddress } from '../utils/address'
import { displayAnoFabModelo, displayPlaca } from '../utils/masks'
import { canViewMyServiceOrders } from '../utils/permissions'
import { formatCurrency, formatServiceOrderDateTime } from '../utils/serviceOrder'
import './HomePage.css'

export function HomePage() {
  const { user } = useAuth()
  const { customers, isLoading: isLoadingCustomers } = useCustomers()
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles()
  const {
    serviceOrders: adminServiceOrders,
    totalElements: totalServiceOrders,
    isLoading: isLoadingServiceOrders,
  } = useServiceOrdersSummary(5)
  const isClientView = canViewMyServiceOrders(user)
  const {
    serviceOrders: myServiceOrders,
    pendingBudgets,
    totalElements: totalMyServiceOrders,
    isLoading: isLoadingMyServiceOrders,
  } = useMyServiceOrdersDashboard()

  if (isClientView) {
    return (
      <div className="page">
        <div className="home-client">
          <header className="page-header">
            <div>
              <h1>Olá, {user?.nome}!</h1>
              <p className="page-subtitle">
                Aprove orçamentos e acompanhe o histórico de atendimentos
              </p>
            </div>
          </header>

          <div className="stats-grid stats-grid--client">
            <div className="stat-card">
              <ClipboardList className="stat-icon" aria-hidden="true" />
              <div>
                <strong>
                  {isLoadingMyServiceOrders ? '...' : totalMyServiceOrders}
                </strong>
                <span>Atendimentos registrados</span>
              </div>
            </div>
            <div className={`stat-card${pendingBudgets.length > 0 ? '' : ' stat-card--muted'}`}>
              <ClipboardList className="stat-icon" aria-hidden="true" />
              <div>
                <strong>
                  {isLoadingMyServiceOrders ? '...' : pendingBudgets.length}
                </strong>
                <span>Orçamentos pendentes</span>
              </div>
            </div>
          </div>

          {!isLoadingMyServiceOrders && pendingBudgets.length > 0 && (
            <section className="home-section">
              <div className="home-section-header">
                <h2>Aguardando sua aprovação</h2>
                <Link to={ROUTES.myServiceOrders} className="btn btn-primary btn-sm">
                  Revisar orçamentos
                </Link>
              </div>
              <div className="recent-list">
                {pendingBudgets.slice(0, 5).map((serviceOrder) => (
                  <div key={serviceOrder.id} className="recent-item recent-item--pending">
                    <div className="recent-item-info">
                      <strong>
                        {serviceOrder.veiculoMarca} {serviceOrder.veiculoModelo}
                      </strong>
                      <small>
                        {displayPlaca(serviceOrder.veiculoPlaca)} ·{' '}
                        {formatServiceOrderDateTime(serviceOrder.data, serviceOrder.hora)}
                      </small>
                    </div>
                    <span className="recent-item-amount">
                      {formatCurrency(serviceOrder.precoTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!isLoadingMyServiceOrders && myServiceOrders.length > 0 && (
            <section className="home-section">
              <div className="home-section-header">
                <h2>Atendimentos recentes</h2>
                <Link to={ROUTES.myServiceOrders} className="btn btn-secondary btn-sm">
                  Ver histórico completo
                </Link>
              </div>
              {myServiceOrders.some((order) => order.status !== 'ORCAMENTO') ? (
                <div className="recent-list">
                  {myServiceOrders
                    .filter((order) => order.status !== 'ORCAMENTO')
                    .slice(0, 5)
                    .map((serviceOrder) => (
                      <div key={serviceOrder.id} className="recent-item">
                        <div className="recent-item-info">
                          <strong>
                            {serviceOrder.veiculoMarca} {serviceOrder.veiculoModelo}
                          </strong>
                          <small>
                            {displayPlaca(serviceOrder.veiculoPlaca)} ·{' '}
                            {formatServiceOrderDateTime(serviceOrder.data, serviceOrder.hora)}
                          </small>
                        </div>
                        <span className="recent-item-amount">
                          {formatCurrency(serviceOrder.precoTotal)}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="home-section-empty">
                  Nenhum atendimento concluído ainda. Aprove um orçamento para iniciar o serviço.
                </p>
              )}
            </section>
          )}

          {!isLoadingMyServiceOrders && myServiceOrders.length === 0 && (
            <div className="empty-state">
              <ClipboardList className="empty-icon" aria-hidden="true" />
              <h2>Nenhum atendimento ainda</h2>
              <p>Quando a oficina registrar uma ordem de serviço, ela aparecerá aqui.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Olá, {user?.nome}!</h1>
          <p className="page-subtitle">
            Bem-vindo ao painel de gerenciamento da oficina
          </p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <Users className="stat-icon" aria-hidden="true" />
          <div>
            <strong>{isLoadingCustomers ? '...' : customers.length}</strong>
            <span>Clientes cadastrados</span>
          </div>
        </div>
        <div className="stat-card">
          <Car className="stat-icon" aria-hidden="true" />
          <div>
            <strong>{isLoadingVehicles ? '...' : vehicles.length}</strong>
            <span>Veículos registrados</span>
          </div>
        </div>
        <div className="stat-card">
          <ClipboardList className="stat-icon" aria-hidden="true" />
          <div>
            <strong>{isLoadingServiceOrders ? '...' : totalServiceOrders}</strong>
            <span>Ordens de serviço</span>
          </div>
        </div>
      </div>

      <div className="home-sections">
        {!isLoadingCustomers && customers.length > 0 && (
          <section className="home-section">
            <h2>Clientes recentes</h2>
            <div className="recent-list">
              {customers.slice(0, 5).map((customer) => (
                <div key={customer.id} className="recent-item">
                  <div className="recent-item-info">
                    <strong>{customer.nome}</strong>
                    <small>{formatCustomerAddress(customer)}</small>
                  </div>
                  <span className="recent-item-phone">
                    {customer.telefone ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isLoadingVehicles && vehicles.length > 0 && (
          <section className="home-section">
            <h2>Veículos recentes</h2>
            <div className="recent-list">
              {vehicles.slice(0, 5).map((vehicle) => (
                <div key={vehicle.id} className="recent-item">
                  <div className="recent-item-info">
                    <strong>
                      {vehicle.marca} {vehicle.modelo}
                    </strong>
                    <small>
                      {displayPlaca(vehicle.placa)} · {vehicle.clienteNome}
                    </small>
                  </div>
                  <span className="recent-item-phone">
                    {displayAnoFabModelo(vehicle.anoFabricacao)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isLoadingServiceOrders && adminServiceOrders.length > 0 && (
          <section className="home-section">
            <h2>Ordens de serviço recentes</h2>
            <div className="recent-list">
              {adminServiceOrders.slice(0, 5).map((serviceOrder) => (
                <div key={serviceOrder.id} className="recent-item">
                  <div className="recent-item-info">
                    <strong>{serviceOrder.clienteNome}</strong>
                    <small>
                      {displayPlaca(serviceOrder.veiculoPlaca)} ·{' '}
                      {formatServiceOrderDateTime(serviceOrder.data, serviceOrder.hora)}
                    </small>
                  </div>
                  <span className="recent-item-phone">
                    {formatCurrency(serviceOrder.precoTotal)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
