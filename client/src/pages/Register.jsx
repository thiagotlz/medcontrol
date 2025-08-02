import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Lock, Loader, Mail, Shield, LogIn } from 'lucide-react'
import { saveAuth, isAuthenticated } from '../utils/auth'
import { authAPI } from '../utils/api'
import '../styles/Auth.css'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  // Verificar se já está autenticado
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    // Validações do frontend
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }
    
    try {
      const result = await authAPI.register(name, email, password)

      if (!result.success) {
        setError(result.message || 'Erro ao criar conta')
        setLoading(false)
        return
      }

      // Salvar dados de autenticação
      const authSaved = saveAuth({
        token: result.data.token,
        user: result.data.user
      })

      if (authSaved) {
        setSuccess('Conta criada com sucesso! Redirecionando...')
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)
      } else {
        setError('Erro ao salvar dados de autenticação')
      }
      
    } catch (err) {
      console.error('[REGISTER] Erro:', err)
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
            <h1 className="auth-title">Criar Conta</h1>
            <p className="auth-subtitle">Comece a gerenciar suas medicações hoje mesmo</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <label htmlFor="name" className="input-label">
                Nome completo
              </label>
              <div className="input-with-icon">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Seu nome completo"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="input-field"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email
              </label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={20} />
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
                  placeholder="Sua senha (mín. 6 caracteres)"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="input-field"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword" className="input-label">
                Confirmar senha
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={20} />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Digite a senha novamente"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            {success && (
              <div className="auth-success">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-action btn-full-width btn-lg"
            >
              {loading && <Loader size={20} className="animate-spin" />}
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">ou</span>
            <div className="auth-divider-line" />
          </div>

          {/* Login Link */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Já tem uma conta?
            </p>
            <Link
              to="/login"
              className="btn-main btn-full-width"
            >
              <LogIn size={20} />
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}