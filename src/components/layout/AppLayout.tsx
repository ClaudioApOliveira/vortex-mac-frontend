import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Car, ClipboardList, Home, LogOut, Shield, Users, type LucideIcon } from 'lucide-react'
import { ROUTES } from '../../routes/paths'
import { useAuth } from '../../contexts/AuthContext'
import { canManageCustomers, canManageServiceOrders, canManageUsers, canManageVehicles, canViewMyServiceOrders } from '../../utils/permissions'
import type { User } from '../../types'
import { Logo } from '../ui/Logo'
import './AppLayout.css'

const navItems: Array<{
  to: string
  label: string
  icon: LucideIcon
  show: (user: User | null) => boolean
}> = [
  { to: ROUTES.home, label: 'Início', icon: Home, show: () => true },
  {
    to: ROUTES.myServiceOrders,
    label: 'Meus atendimentos',
    icon: ClipboardList,
    show: canViewMyServiceOrders,
  },
  {
    to: ROUTES.customers,
    label: 'Clientes',
    icon: Users,
    show: canManageCustomers,
  },
  {
    to: ROUTES.vehicles,
    label: 'Veículos',
    icon: Car,
    show: canManageVehicles,
  },
  {
    to: ROUTES.serviceOrders,
    label: 'Ordens de Serviço',
    icon: ClipboardList,
    show: canManageServiceOrders,
  },
  {
    to: ROUTES.users,
    label: 'Usuários',
    icon: Shield,
    show: canManageUsers,
  },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.login)
  }

  const visibleNavItems = navItems.filter((item) => item.show(user))

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo variant="compact" className="sidebar-logo sidebar-logo--full" />
          <Logo variant="icon" className="sidebar-logo sidebar-logo--icon" />
          <Logo variant="mobile" className="sidebar-logo sidebar-logo--mobile" />
        </div>

        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.home}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link--active' : ''}`
                }
              >
                <Icon className="nav-icon" aria-hidden="true" />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to={ROUTES.profile}
            className={({ isActive }) =>
              `user-info user-info-link ${isActive ? 'user-info-link--active' : ''}`
            }
          >
            <span className="user-avatar">
              {user?.nome.charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{user?.nome}</strong>
              <small>{user?.email}</small>
            </div>
          </NavLink>
          <button type="button" className="btn btn-ghost sidebar-logout" onClick={handleLogout}>
            <LogOut className="sidebar-logout-icon" aria-hidden="true" />
            <span className="sidebar-logout-label">Sair</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
