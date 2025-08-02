import React, { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { removeAuth, getUser } from '../utils/auth'
import { 
  Home, 
  Settings,
  Menu,
  X,
  Pill,
  LogOut,
  User,
  Shield
} from 'lucide-react'
import '../styles/LayoutPadrao.css'

export default function LayoutPadrao() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Obter dados do usuário
    const userData = getUser()
    setUser(userData)

    // Aplicar tema
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleLogout = () => {
    removeAuth()
    navigate('/login', { replace: true })
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const menuItems = [
    {
      to: '/dashboard',
      icon: Home,
      label: 'Dashboard',
      end: true
    },
    {
      to: '/medications',
      icon: Pill,
      label: 'Medicamentos',
      end: false
    },
    {
      to: '/settings',
      icon: Settings,
      label: 'Configurações',
      end: false
    }
  ]

  return (
    <div className="layout-container">
      {/* HEADER MOBILE */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <button 
            className="btn-main mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="mobile-logo">
            <div className="logo-icon">
              <Shield size={32} />
            </div>
            <span className="logo-text">MedControl</span>
          </div>
          
          <div className="mobile-header-spacer"></div>
        </div>
      </header>

      {/* MENU MOBILE OVERLAY */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          {/* Menu de navegação */}
          <nav className="mobile-nav-menu">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `btn-main btn-full-width mobile-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User section mobile */}
          <div className="mobile-user-section">
            <div className="user-info">
              <div className="user-avatar">
                <User size={20} />
              </div>
              <div className="user-details">
                <div className="user-name">{user?.name}</div>
                <div className="user-email">{user?.email}</div>
              </div>
            </div>
            <button 
              className="btn-main btn-error"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* USER AVATAR FIXED */}
      <div className="user-avatar-fixed">
        <div className="user-menu">
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button 
            className="btn-main btn-sm"
            onClick={handleLogout}
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="layout-base">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <Shield size={32} />
              <span className="sidebar-logo-text">MedControl</span>
            </div>
          </div>

          <nav className="sidebar-menu">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `btn-main btn-sidebar ${isActive ? 'active' : ''}`}
              >
                <item.icon className="menu-icon"/>
                <span className="menu-text">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button 
              className="btn-main btn-sidebar theme-toggle"
              onClick={toggleTheme}
              title={`Trocar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
              <span className="menu-text">
                {theme === 'light' ? 'Escuro' : 'Claro'}
              </span>
            </button>
          </div>
        </aside>

        {/* Conteúdo dinâmico */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}