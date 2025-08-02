import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { User, Lock, Loader, UserPlus, Shield } from 'lucide-react'
import { saveAuth, isAuthenticated } from '../utils/auth'
import { authAPI } from '../utils/api'
import '../styles/Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  // Verificar se já está autenticado
  useEffect(() => {
    if (location.state?.expired) {
      setError('Sua sessão expirou. Faça login novamente.')
    }
    
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, location.state])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const result = await authAPI.login(email, password)

      if (!result.success) {
        setError(result.message || 'Email ou senha inválidos')
        setLoading(false)
        return
      }

      // Salvar dados de autenticação
      const authSaved = saveAuth({
        token: result.data.token,
        user: result.data.user
      })

      if (authSaved) {
        // Navegar para dashboard
        navigate('/dashboard', { replace: true })
      } else {
        setError('Erro ao salvar dados de autenticação')
      }
      
    } catch (err) {
      console.error('[LOGIN] Erro:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-background" />
      
      <div className="auth-content">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <Shield size={40} />
              <span className="auth-logo-text">MedControl</span>
            </div>
            <h1 className="auth-title">Bem-vindo de volta</h1>
            <p className="auth-subtitle">Faça login para gerenciar suas medicações</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email
              </label>
              <div className="input-with-icon">
                <User className="input-icon" size={20} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Seu e-mail"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="input-field"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Senha
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={20} />
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Sua senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="input-field"
                />
              </div>
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-action btn-full-width btn-lg"
            >
              {loading && <Loader size={20} className="animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">ou</span>
            <div className="auth-divider-line" />
          </div>

          {/* Register Link */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Primeira vez aqui?
            </p>
            <Link
              to="/register"
              className="btn-main btn-full-width"
            >
              <UserPlus size={20} />
              Criar Conta Gratuita
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}