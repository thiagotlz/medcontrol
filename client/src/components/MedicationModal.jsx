import React, { useState, useEffect } from 'react'
import { X, Pill, Clock, Calendar, Loader, Info } from 'lucide-react'
import { medicationsAPI } from '../utils/api'

export default function MedicationModal({ medication, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dosage: '',
    frequency_hours: '',
    start_time: '',
    duration_days: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name || '',
        description: medication.description || '',
        dosage: medication.dosage || '',
        frequency_hours: medication.frequency_hours || '',
        start_time: medication.start_time || '',
        duration_days: medication.duration_days || ''
      })
    }
  }, [medication])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = medication
        ? await medicationsAPI.update(medication.id, formData)
        : await medicationsAPI.create(formData)

      if (result.success) {
        onSuccess()
      } else {
        setError(result.message || 'Erro ao salvar medicamento')
      }
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content medication-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Pill size={24} />
            <span>{medication ? 'Editar Medicamento' : 'Novo Medicamento'}</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="medication-form">
            {/* Nome do medicamento */}
            <div className="input-group">
              <label htmlFor="name" className="input-label">
                Nome do medicamento *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Ex: Paracetamol"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={loading}
                className="input-field"
              />
            </div>

            {/* Dosagem */}
            <div className="input-group">
              <label htmlFor="dosage" className="input-label">
                Dosagem
              </label>
              <input
                type="text"
                id="dosage"
                name="dosage"
                placeholder="Ex: 500mg, 1 comprimido, 5ml"
                value={formData.dosage}
                onChange={(e) => handleInputChange('dosage', e.target.value)}
                disabled={loading}
                className="input-field"
              />
            </div>

            {/* Frequência e Horário */}
            <div className="input-row">
              <div className="input-group">
                <label htmlFor="frequency_hours" className="input-label">
                  Frequência (horas) *
                </label>
                <select
                  id="frequency_hours"
                  name="frequency_hours"
                  required
                  value={formData.frequency_hours}
                  onChange={(e) => handleInputChange('frequency_hours', e.target.value)}
                  disabled={loading}
                  className="input-field select-field"
                >
                  <option value="">Selecione</option>
                  <option value="1">1 hora</option>
                  <option value="2">2 horas</option>
                  <option value="3">3 horas</option>
                  <option value="4">4 horas</option>
                  <option value="6">6 horas</option>
                  <option value="8">8 horas</option>
                  <option value="12">12 horas</option>
                  <option value="24">24 horas (1x/dia)</option>
                  <option value="48">48 horas (1x/2 dias)</option>
                  <option value="72">72 horas (1x/3 dias)</option>
                  <option value="168">168 horas (1x/semana)</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="start_time" className="input-label">
                  Primeiro horário *
                </label>
                <div className="input-with-icon">
                  <Clock className="input-icon" size={16} />
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    required
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    disabled={loading}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Duração do tratamento */}
            <div className="input-group">
              <label htmlFor="duration_days" className="input-label">
                Duração do tratamento (dias)
              </label>
              <div className="input-with-icon">
                <Calendar className="input-icon" size={16} />
                <input
                  type="number"
                  id="duration_days"
                  name="duration_days"
                  min="1"
                  max="365"
                  placeholder="Ex: 7, 14, 30 (deixe vazio para contínuo)"
                  value={formData.duration_days}
                  onChange={(e) => handleInputChange('duration_days', e.target.value)}
                  disabled={loading}
                  className="input-field"
                />
              </div>
              <div className="input-helper">
                <Info size={14} />
                <span>Deixe vazio para tratamento contínuo. Defina para ver gráficos de progresso.</span>
              </div>
            </div>

            {/* Observações */}
            <div className="input-group">
              <label htmlFor="description" className="input-label">
                Observações
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Instruções especiais, observações médicas, etc."
                rows="3"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={loading}
                className="input-field textarea-field"
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Ações */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-main"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-action"
                disabled={loading}
              >
                {loading && <Loader size={16} className="animate-spin" />}
                {loading 
                  ? (medication ? 'Salvando...' : 'Criando...')
                  : (medication ? 'Salvar' : 'Criar')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}