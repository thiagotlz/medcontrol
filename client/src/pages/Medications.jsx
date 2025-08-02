import React, { useState, useEffect } from 'react'
import { 
  Pill, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Timer
} from 'lucide-react'
import { medicationsAPI } from '../utils/api'
import MedicationModal from '../components/MedicationModal'
import ProgressChart from '../components/ProgressChart'
import '../styles/Medications.css'

export default function Medications() {
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, completed, continuous

  useEffect(() => {
    loadMedications()
  }, [])

  const loadMedications = async () => {
    try {
      setLoading(true)
      const result = await medicationsAPI.list(false) // Incluir inativos
      
      if (result.success) {
        setMedications(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMedication = () => {
    setEditingMedication(null)
    setIsModalOpen(true)
  }

  const handleEditMedication = (medication) => {
    setEditingMedication(medication)
    setIsModalOpen(true)
  }

  const handleDeleteMedication = async (medication) => {
    if (!confirm(`Tem certeza que deseja excluir "${medication.name}"?`)) {
      return
    }

    try {
      const result = await medicationsAPI.delete(medication.id)
      
      if (result.success) {
        setMedications(prev => prev.filter(m => m.id !== medication.id))
      } else {
        alert(result.message || 'Erro ao excluir medicamento')
      }
    } catch (error) {
      console.error('Erro ao excluir medicamento:', error)
      alert('Erro ao excluir medicamento')
    }
  }

  const handleToggleMedication = async (medication) => {
    try {
      const result = await medicationsAPI.toggle(medication.id)
      
      if (result.success) {
        setMedications(prev => 
          prev.map(m => m.id === medication.id ? result.data : m)
        )
      } else {
        alert(result.message || 'Erro ao alterar status do medicamento')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      alert('Erro ao alterar status do medicamento')
    }
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false)
    setEditingMedication(null)
    loadMedications()
  }

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':')
      return `${hours}:${minutes}`
    } catch {
      return timeString
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-success'
      case 'completed': return 'text-primary'
      case 'continuous': return 'text-warning'
      default: return 'text-secondary'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Em andamento'
      case 'completed': return 'Concluído'
      case 'continuous': return 'Contínuo'
      default: return 'Não iniciado'
    }
  }

  const filteredMedications = medications.filter(medication => {
    if (filter === 'all') return true
    if (filter === 'active') return medication.active && medication.treatmentStatus === 'active'
    if (filter === 'completed') return medication.treatmentStatus === 'completed'
    if (filter === 'continuous') return medication.treatmentStatus === 'continuous'
    return true
  })

  if (loading) {
    return (
      <div className="medications-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-secondary">Carregando medicamentos...</p>
      </div>
    )
  }

  return (
    <div className="medications">
      {/* Header */}
      <div className="medications-header">
        <div className="medications-title-section">
          <h1 className="medications-title">
            <Pill size={28} />
            Medicamentos
          </h1>
          <p className="medications-subtitle">
            Gerencie suas medicações e acompanhe o progresso dos tratamentos
          </p>
        </div>
        
        <button 
          className="btn-action"
          onClick={handleCreateMedication}
        >
          <Plus size={20} />
          Novo Medicamento
        </button>
      </div>

      {/* Filtros */}
      <div className="medications-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({medications.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Em Andamento ({medications.filter(m => m.active && m.treatmentStatus === 'active').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'continuous' ? 'active' : ''}`}
          onClick={() => setFilter('continuous')}
        >
          Contínuos ({medications.filter(m => m.treatmentStatus === 'continuous').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Concluídos ({medications.filter(m => m.treatmentStatus === 'completed').length})
        </button>
      </div>

      {/* Charts de Progresso - apenas para medicamentos com duração definida */}
      {filteredMedications.filter(m => m.progress).length > 0 && (
        <div className="progress-section">
          <h2 className="section-title">
            <TrendingUp size={20} />
            Progresso dos Tratamentos
          </h2>
          
          <div className="progress-grid">
            {filteredMedications
              .filter(medication => medication.progress)
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

      {/* Lista de medicamentos */}
      <div className="medications-section">
        <h2 className="section-title">
          <Pill size={20} />
          Lista de Medicamentos
        </h2>

        {filteredMedications.length === 0 ? (
          <div className="empty-state">
            <Pill size={48} className="empty-icon" />
            <h3>Nenhum medicamento encontrado</h3>
            <p>
              {filter === 'all' 
                ? 'Comece adicionando seus primeiros medicamentos'
                : `Nenhum medicamento ${getStatusLabel(filter).toLowerCase()} encontrado`
              }
            </p>
            {filter === 'all' && (
              <button 
                className="btn-action"
                onClick={handleCreateMedication}
              >
                <Plus size={16} />
                Adicionar Medicamento
              </button>
            )}
          </div>
        ) : (
          <div className="medications-grid">
            {filteredMedications.map(medication => (
              <div key={medication.id} className="medication-card">
                {/* Header do card */}
                <div className="medication-card-header">
                  <div className="medication-info">
                    <h3 className="medication-name">{medication.name}</h3>
                    <div className={`medication-status ${getStatusColor(medication.treatmentStatus)}`}>
                      {medication.treatmentStatus === 'active' && <Timer size={14} />}
                      {medication.treatmentStatus === 'completed' && <CheckCircle size={14} />}
                      {medication.treatmentStatus === 'continuous' && <AlertCircle size={14} />}
                      <span>{getStatusLabel(medication.treatmentStatus)}</span>
                    </div>
                  </div>
                  
                  <div className="medication-actions">
                    <button 
                      className="btn-main btn-sm"
                      onClick={() => handleToggleMedication(medication)}
                      title={medication.active ? 'Pausar' : 'Ativar'}
                    >
                      {medication.active ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button 
                      className="btn-main btn-sm"
                      onClick={() => handleEditMedication(medication)}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn-main btn-sm btn-error"
                      onClick={() => handleDeleteMedication(medication)}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Detalhes do medicamento */}
                <div className="medication-details">
                  {medication.dosage && (
                    <div className="detail-item">
                      <strong>Dosagem:</strong> {medication.dosage}
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <strong>Frequência:</strong> A cada {medication.frequency_hours}h
                  </div>
                  
                  <div className="detail-item">
                    <Clock size={14} />
                    <strong>Horário:</strong> {formatTime(medication.start_time)}
                  </div>

                  {medication.duration_days && (
                    <div className="detail-item">
                      <Calendar size={14} />
                      <strong>Duração:</strong> {medication.duration_days} dias
                    </div>
                  )}

                  {medication.description && (
                    <div className="detail-item description">
                      <strong>Observações:</strong> {medication.description}
                    </div>
                  )}
                </div>

                {/* Progresso inline para tratamentos com duração */}
                {medication.progress && (
                  <div className="medication-progress">
                    <div className="progress-info">
                      <span className="progress-label">
                        Dia {medication.progress.daysPassed + 1} de {medication.progress.totalDays}
                      </span>
                      <span className="progress-percentage">
                        {medication.progress.progressPercentage}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${medication.progress.progressPercentage}%` }}
                      />
                    </div>
                    <div className="progress-dates">
                      <span className="start-date">{medication.progress.startDate}</span>
                      <span className="end-date">{medication.progress.endDate}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de medicamento */}
      {isModalOpen && (
        <MedicationModal
          medication={editingMedication}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}