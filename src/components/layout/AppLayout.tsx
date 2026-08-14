import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Car,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  PanelLeftClose,
  Shield,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '../../routes/paths'
import { useAuth } from '../../contexts/AuthContext'
import {
  canAccessLgpdQueue,
  canAccessOfficeReports,
  canManageCustomers,
  canManageServiceOrders,
  canManageUsers,
  canManageVehicles,
  canViewMyServiceOrders,
} from '../../utils/permissions'
import type { User } from '../../types'
import { Logo } from '../ui/Logo'
import './AppLayout.css'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  show: (user: User | null) => boolean
}

type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    id: 'principal',
    label: '',
    items: [{ to: ROUTES.home, label: 'Início', icon: Home, show: () => true }],
  },
  {
    id: 'portal',
    label: 'Meu portal',
    items: [
      {
        to: ROUTES.myServiceOrders,
        label: 'Atendimentos',
        icon: ClipboardList,
        show: canViewMyServiceOrders,
      },
      {
        to: ROUTES.myReports,
        label: 'Relatórios',
        icon: FileText,
        show: canViewMyServiceOrders,
      },
    ],
  },
  {
    id: 'oficina',
    label: 'Oficina',
    items: [
      {
        to: ROUTES.serviceOrders,
        label: 'Ordens de serviço',
        icon: ClipboardList,
        show: canManageServiceOrders,
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
        to: ROUTES.reports,
        label: 'Relatórios',
        icon: FileText,
        show: canAccessOfficeReports,
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administração',
    items: [
      {
        to: ROUTES.users,
        label: 'Usuários',
        icon: Shield,
        show: canManageUsers,
      },
      {
        to: ROUTES.lgpdQueue,
        label: 'Solicitações LGPD',
        icon: ShieldAlert,
        show: canAccessLgpdQueue,
      },
    ],
  },
]

const SIDEBAR_COLLAPSED_KEY = 'vortex.sidebar-collapsed'

function readSidebarCollapsed() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed)

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.login)
  }

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      } catch {
        /* ignore quota / private mode */
      }
      return next
    })
  }

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.show(user)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="app-layout">
      <div className={`sidebar-shell ${collapsed ? 'sidebar-shell--collapsed' : ''}`}>
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
          <div className="sidebar-brand">
            <div className="sidebar-brand-logos">
              <Logo variant="compact" className="sidebar-logo sidebar-logo--full" />
              <Logo variant="icon" className="sidebar-logo sidebar-logo--icon" />
              <Logo variant="mobile" className="sidebar-logo sidebar-logo--mobile" />
            </div>
          </div>

        <nav className="sidebar-nav">
          {visibleNavGroups.map((group) => (
            <div key={group.id} className="nav-group">
              {group.label ? (
                <p className="nav-group-label">{group.label}</p>
              ) : null}
              {group.items.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === ROUTES.home}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link--active' : ''}`
                    }
                  >
                    <Icon className="nav-icon" aria-hidden="true" />
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to={ROUTES.profile}
            title={collapsed ? 'Meu perfil' : undefined}
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
          <button
            type="button"
            className="btn btn-ghost sidebar-logout"
            onClick={handleLogout}
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut className="sidebar-logout-icon" aria-hidden="true" />
            <span className="sidebar-logout-label">Sair</span>
          </button>
        </div>
      </aside>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expandir menu' : 'Minimizar menu'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expandir menu' : 'Minimizar menu'}
      >
        <PanelLeftClose className="sidebar-toggle-icon" aria-hidden="true" />
      </button>
      </div>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
