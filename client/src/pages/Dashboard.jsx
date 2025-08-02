import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Pill, 
  Calendar, 
  TrendingUp, 
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { medicationsAPI, settingsAPI } from '../utils/api'
import { getUser } from '../utils/auth'
import ProgressChart from '../components/ProgressChart'

export default function Dashboard() {
  const [user] = useState(getUser())
  const [stats, setStats] = useState(null)
  const [medications, setMedications] = useState([])
  const [recentSchedules, setRecentSchedules] = useState([])
  const [settingsStatus, setSettingsStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados em paralelo
      const [statsResult, medicationsResult, settingsResult] = await Promise.all([
        medicationsAPI.getStats(30),
        medicationsAPI.list(),
        settingsAPI.getStatus()
      ])

      if (statsResult.success) {
        setStats(statsResult.data)
      }

      if (medicationsResult.success) {
        setMedications(medicationsResult.data)
      }

      if (settingsResult.success) {
        setSettingsStatus(settingsResult.data)
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':')
      return `${hours}:${minutes}`
    } catch {
      return timeString
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    const firstName = user?.name?.split(' ')[0] || 'Usuário'
    
    if (hour < 12) return `Bom dia, ${firstName}!`
    if (hour < 18) return `Boa tarde, ${firstName}!`
    return `Boa noite, ${firstName}!`
  }

  const getAdherenceColor = (rate) => {
    if (rate >= 80) return 'text-success'
    if (rate >= 60) return 'text-warning'
    return 'text-error'
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-container-column">
          <div className="animate-spin loading-spinner"></div>
          <p className="loading-text">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1 className="dashboard-title">{getGreeting()}</h1>
          <p className="dashboard-subtitle">
            Aqui está um resumo das suas medicações
          </p>
        </div>
        
        <div className="dashboard-actions">
          <Link to="/medications" className="btn-action">
            <Plus size={20} />
            Novo Medicamento
          </Link>
        </div>
      </div>

      {/* Alert de configuração */}
      {settingsStatus && !settingsStatus.isFullyConfigured && (
        <div className="alert-card">
          <AlertCircle size={24} />
          <div className="alert-content">
            <h3>Configure suas notificações</h3>
            <p>
              Para receber lembretes automáticos, configure seu email do Pushover e servidor SMTP.
            </p>
            <Link to="/settings" className="btn-action btn-sm">
              Configurar Agora
            </Link>
          </div>
        </div>
      )}

      {/* Cards de estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Pill size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{medications.length}</div>
            <div className="stat-label">Medicamentos Ativos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.total || 0}</div>
            <div className="stat-label">Doses nos últimos 30 dias</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.taken || 0}</div>
            <div className="stat-label">Doses tomadas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className={`stat-value ${getAdherenceColor(stats?.adherenceRate || 0)}`}>
              {stats?.adherenceRate || 0}%
            </div>
            <div className="stat-label">Taxa de adesão</div>
          </div>
        </div>
      </div>

      {/* Charts de Progresso - apenas para medicamentos com duração definida */}
      {medications.filter(m => m.progress).length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              Progresso dos Tratamentos
            </h2>
            <Link to="/medications" className="section-action">
              Ver detalhes
            </Link>
          </div>
          
          <div className="progress-grid">
            {medications
              .filter(medication => medication.progress)
              .slice(0, 3) // Mostrar apenas os 3 primeiros no dashboard
              .map(medication => (
                <ProgressChart 
                  key={medication.id}
                  medication={medication}
                />
              ))
            }
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Medicamentos ativos */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              Medicamentos Ativos
            </h2>
            <Link to="/medications" className="section-action">
              Ver todos
            </Link>
          </div>

          <div className="medications-list">
            {medications.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhum medicamento cadastrado</h3>
                <p>Comece adicionando seus primeiros medicamentos</p>
                <Link to="/medications" className="btn-action">
                  <Plus size={16} />
                  Adicionar Medicamento
                </Link>
              </div>
            ) : (
              medications.slice(0, 5).map((medication) => (
                <div key={medication.id} className="medication-item">
                  <div className="medication-info">
                    <div className="medication-name">{medication.name}</div>
                    <div className="medication-details">
                      {medication.dosage && (
                        <span className="medication-dosage">{medication.dosage}</span>
                      )}
                      <span className="medication-frequency">
                        A cada {medication.frequency_hours}h
                      </span>
                      <span className="medication-time">
                        Próxima dose: {formatTime(medication.start_time)}
                      </span>
                    </div>
                  </div>
                  <div className="medication-status">
                    <div className={`status-indicator ${medication.active ? 'active' : 'inactive'}`}>
                      {medication.active ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status das configurações */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              Status das Configurações
            </h2>
            <Link to="/settings" className="section-action">
              Configurar
            </Link>
          </div>

          <div className="settings-status">
            {settingsStatus ? (
              <>
                <div className="status-item">
                  <div className="status-icon">
                    {settingsStatus.hasPushoverEmail ? (
                      <CheckCircle size={20} className="text-success" />
                    ) : (
                      <XCircle size={20} className="text-error" />
                    )}
                  </div>
                  <div className="status-content">
                    <div className="status-title">Email do Pushover</div>
                    <div className="status-description">
                      {settingsStatus.hasPushoverEmail 
                        ? 'Configurado' 
                        : 'Não configurado'
                      }
                    </div>
                  </div>
                </div>

                <div className="status-item">
                  <div className="status-icon">
                    {settingsStatus.hasSMTPConfig ? (
                      <CheckCircle size={20} className="text-success" />
                    ) : (
                      <XCircle size={20} className="text-error" />
                    )}
                  </div>
                  <div className="status-content">
                    <div className="status-title">Servidor SMTP</div>
                    <div className="status-description">
                      {settingsStatus.hasSMTPConfig 
                        ? 'Configurado' 
                        : 'Não configurado'
                      }
                    </div>
                  </div>
                </div>

                <div className="status-item">
                  <div className="status-icon">
                    {settingsStatus.notificationsEnabled ? (
                      <CheckCircle size={20} className="text-success" />
                    ) : (
                      <XCircle size={20} className="text-warning" />
                    )}
                  </div>
                  <div className="status-content">
                    <div className="status-title">Notificações</div>
                    <div className="status-description">
                      {settingsStatus.notificationsEnabled 
                        ? 'Habilitadas' 
                        : 'Desabilitadas'
                      }
                    </div>
                  </div>
                </div>

                {settingsStatus.isFullyConfigured && (
                  <div className="status-summary success">
                    <CheckCircle size={20} />
                    <span>Tudo configurado! Você receberá notificações automaticamente.</span>
                  </div>
                )}
              </>
            ) : (
              <div className="status-loading">
                <div className="animate-pulse">Carregando status...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}