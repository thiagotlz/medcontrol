import React, { useState, useEffect } from 'react'
import { 
  Mail, 
  Shield, 
  TestTube,
  Save,
  Loader,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { settingsAPI } from '../utils/api'
import '../styles/Settings.css'

export default function Settings() {
  const [settings, setSettings] = useState({
    pushover_email: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_password: '',
    notifications_enabled: true
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    loadSettings()
    loadStatus()
  }, [])

  const loadSettings = async () => {
    try {
      const result = await settingsAPI.get()
      
      if (result.success) {
        setSettings(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' })
    } finally {
      setLoading(false)
    }
  }

  const loadStatus = async () => {
    try {
      const result = await settingsAPI.getStatus()
      
      if (result.success) {
        setStatus(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await settingsAPI.update(settings)

      if (result.success) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
        setSettings(result.data)
        loadStatus() // Atualizar status
      } else {
        setMessage({ type: 'error', text: result.message || 'Erro ao salvar configurações' })
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestSMTP = async () => {
    setTesting(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await settingsAPI.testSMTP()

      if (result.success) {
        setMessage({ type: 'success', text: 'Email de teste enviado com sucesso! Verifique seu Pushover.' })
      } else {
        setMessage({ type: 'error', text: result.message || 'Erro ao enviar email de teste' })
      }
    } catch (error) {
      console.error('Erro ao testar SMTP:', error)
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' })
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (isValid) => {
    if (isValid) {
      return <CheckCircle size={20} className="text-success" />
    }
    return <XCircle size={20} className="text-error" />
  }

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-secondary">Carregando configurações...</p>
      </div>
    )
  }

  return (
    <div className="settings">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-title-section">
          <h1 className="settings-title">
            Configurações
          </h1>
          <p className="settings-subtitle">
            Configure suas notificações e servidor de email
          </p>
        </div>
      </div>

      {/* Status geral */}
      {status && (
        <div className="settings-status">
          <h2 className="section-title">
            Status das Configurações
          </h2>
          
          <div className="status-grid">
            <div className="status-item">
              {getStatusIcon(status.hasPushoverEmail)}
              <div className="status-content">
                <div className="status-title">Email do Pushover</div>
                <div className="status-description">
                  {status.hasPushoverEmail ? 'Configurado' : 'Não configurado'}
                </div>
              </div>
            </div>

            <div className="status-item">
              {getStatusIcon(status.hasSMTPConfig)}
              <div className="status-content">
                <div className="status-title">Servidor SMTP</div>
                <div className="status-description">
                  {status.hasSMTPConfig ? 'Configurado' : 'Incompleto'}
                </div>
              </div>
            </div>

            <div className="status-item">
              {getStatusIcon(status.notificationsEnabled)}
              <div className="status-content">
                <div className="status-title">Notificações</div>
                <div className="status-description">
                  {status.notificationsEnabled ? 'Habilitadas' : 'Desabilitadas'}
                </div>
              </div>
            </div>

            <div className="status-item">
              {getStatusIcon(status.isFullyConfigured)}
              <div className="status-content">
                <div className="status-title">Sistema</div>
                <div className="status-description">
                  {status.isFullyConfigured ? 'Pronto para uso' : 'Configuração pendente'}
                </div>
              </div>
            </div>
          </div>

          {status.isFullyConfigured && (
            <div className="status-summary success">
              <CheckCircle size={20} />
              <span>Todas as configurações estão corretas! O sistema enviará notificações automaticamente.</span>
            </div>
          )}

          {!status.isFullyConfigured && (
            <div className="status-summary warning">
              <AlertCircle size={20} />
              <span>Complete as configurações abaixo para receber notificações automáticas.</span>
            </div>
          )}
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="settings-form">
        {/* Configurações do Pushover */}
        <div className="form-section">
          <h3 className="form-section-title">
            Configurações do Pushover
          </h3>
          <p className="section-description">
            Configure o email que receberá as notificações e as encaminhará para seu app Pushover
          </p>

          <div className="input-group">
            <label htmlFor="pushover_email" className="input-label">
              Email do Pushover *
            </label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={16} />
              <input
                type="email"
                id="pushover_email"
                name="pushover_email"
                placeholder="seu-email@pushover.com"
                value={settings.pushover_email}
                onChange={(e) => handleInputChange('pushover_email', e.target.value)}
                disabled={saving}
                className="input-field"
              />
            </div>
            <div className="input-helper">
              <span>Este é o email que você configurou no app Pushover para receber notificações</span>
            </div>
          </div>

          <div className="input-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) => handleInputChange('notifications_enabled', e.target.checked)}
                disabled={saving}
                className="checkbox-field"
              />
              <span className="checkbox-text">Habilitar notificações automáticas</span>
            </label>
          </div>
        </div>

        {/* Configurações SMTP */}
        <div className="form-section">
          <h3 className="form-section-title">
            Configurações do Servidor SMTP
          </h3>
          <p className="section-description">
            Configure seu servidor de email para enviar as notificações
          </p>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="smtp_host" className="input-label">
                Servidor SMTP *
              </label>
              <input
                type="text"
                id="smtp_host"
                name="smtp_host"
                placeholder="smtp.gmail.com"
                value={settings.smtp_host}
                onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                disabled={saving}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label htmlFor="smtp_port" className="input-label">
                Porta SMTP *
              </label>
              <select
                id="smtp_port"
                name="smtp_port"
                value={settings.smtp_port}
                onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value))}
                disabled={saving}
                className="input-field select-field"
              >
                <option value="25">25 (Padrão)</option>
                <option value="465">465 (SSL)</option>
                <option value="587">587 (TLS)</option>
                <option value="2525">2525 (Alternativo)</option>
              </select>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="smtp_user" className="input-label">
                Email SMTP *
              </label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={16} />
                <input
                  type="email"
                  id="smtp_user"
                  name="smtp_user"
                  placeholder="seu-email@gmail.com"
                  value={settings.smtp_user}
                  onChange={(e) => handleInputChange('smtp_user', e.target.value)}
                  disabled={saving}
                  className="input-field"
                />
              </div>
              <div className="input-helper">
                <span>Email usado para autenticação no servidor SMTP</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="smtp_password" className="input-label">
                Senha SMTP *
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="smtp_password"
                  name="smtp_password"
                  placeholder="Sua senha ou senha de app"
                  value={settings.smtp_password}
                  onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                  disabled={saving}
                  className="input-field password-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={saving}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="input-helper">
                <span>Para Gmail, use uma senha de app. Para outros provedores, use sua senha normal.</span>
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.smtp_secure}
                onChange={(e) => handleInputChange('smtp_secure', e.target.checked)}
                disabled={saving}
                className="checkbox-field"
              />
              <span className="checkbox-text">Usar conexão segura (SSL/TLS)</span>
            </label>
            <div className="input-helper">
              <span>Recomendado para portas 465 (SSL) e 587 (TLS)</span>
            </div>
          </div>
        </div>

        {/* Mensagem de feedback */}
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' && <CheckCircle size={16} />}
            {message.type === 'error' && <XCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Ações */}
        <div className="settings-actions">
          <button
            type="button"
            className="btn-main"
            onClick={handleTestSMTP}
            disabled={saving || testing || !settings.smtp_host || !settings.smtp_user || !settings.pushover_email}
          >
            {testing && <Loader size={16} className="animate-spin" />}
            <TestTube size={16} />
            {testing ? 'Testando...' : 'Testar Email'}
          </button>

          <button
            type="submit"
            className="btn-action"
            disabled={saving || testing}
          >
            {saving && <Loader size={16} className="animate-spin" />}
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>

      {/* Guia de configuração */}
      <div className="form-section">
        <h3 className="form-section-title">
          Como Configurar
        </h3>
        
        <div className="help-content">
          <div className="help-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Instale o app Pushover</h4>
              <p>Baixe o app Pushover na App Store ou Google Play e crie uma conta.</p>
            </div>
          </div>

          <div className="help-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Configure o email Pushover</h4>
              <p>No app, vá em configurações e configure um email para receber notificações.</p>
            </div>
          </div>

          <div className="help-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Configure SMTP</h4>
              <p>Para Gmail: use smtp.gmail.com, porta 587, e crie uma senha de app.</p>
            </div>
          </div>

          <div className="help-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Teste a configuração</h4>
              <p>Use o botão "Testar Email" para verificar se tudo está funcionando.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}