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
  const [customFrequency, setCustomFrequency] = useState('')
  const [showCustomFrequency, setShowCustomFrequency] = useState(false)
  const [alreadyTaken, setAlreadyTaken] = useState(false)
  const [dosesTaken, setDosesTaken] = useState('')
  const [lastTakenTime, setLastTakenTime] = useState('')

  useEffect(() => {
    if (medication) {
      const frequency = medication.frequency_hours || ''
      const isCustom = frequency && !['1','2','3','4','6','8','12','24','48','72','168'].includes(frequency.toString())
      
      setFormData({
        name: medication.name || '',
        description: medication.description || '',
        dosage: medication.dosage || '',
        frequency_hours: isCustom ? 'custom' : frequency,
        start_time: medication.start_time || '',
        duration_days: medication.duration_days || ''
      })
      
      if (isCustom) {
        setShowCustomFrequency(true)
        setCustomFrequency(frequency.toString())
      }
    }
  }, [medication])

  // Função para formatar frequência personalizada
  const parseCustomFrequency = (input) => {
    if (!input) return null
    
    // Remove espaços e converte para minúsculas
    const clean = input.toLowerCase().trim()
    
    // Padrões aceitos e suas conversões para horas
    const patterns = [
      // Formato: número + unidade
      { regex: /^(\d+(?:\.\d+)?)\s*h(?:oras?)?$/i, multiplier: 1 },
      { regex: /^(\d+(?:\.\d+)?)\s*d(?:ias?)?$/i, multiplier: 24 },
      { regex: /^(\d+(?:\.\d+)?)\s*sem(?:anas?)?$/i, multiplier: 168 },
      { regex: /^(\d+(?:\.\d+)?)\s*m(?:eses?)?$/i, multiplier: 720 }, // 30 dias
      
      // Formato: apenas número (assume horas)
      { regex: /^(\d+(?:\.\d+)?)$/i, multiplier: 1 },
      
      // Formato: "X vezes por dia" -> 24/X horas
      { regex: /^(\d+)\s*(?:x|vezes?)\s*(?:por|\/)\s*dia$/i, multiplier: (num) => 24 / num },
      
      // Formato: "de X em X horas"
      { regex: /^(?:de\s*)?(\d+(?:\.\d+)?)\s*(?:em\s*\d+(?:\.\d+)?\s*)?h(?:oras?)?$/i, multiplier: 1 },
    ]
    
    for (const pattern of patterns) {
      const match = clean.match(pattern.regex)
      if (match) {
        const number = parseFloat(match[1])
        if (isNaN(number) || number <= 0) continue
        
        const hours = typeof pattern.multiplier === 'function' 
          ? pattern.multiplier(number) 
          : number * pattern.multiplier
          
        // Limitar entre 0.5 e 8760 horas (1 ano)
        if (hours >= 0.5 && hours <= 8760) {
          return Math.round(hours * 100) / 100 // Arredondar para 2 casas decimais
        }
      }
    }
    
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Preparar dados para envio
      let submitData = { ...formData }
      
      // Se frequência personalizada, processar o valor
      if (formData.frequency_hours === 'custom') {
        const parsedFrequency = parseCustomFrequency(customFrequency)
        
        if (!parsedFrequency) {
          setError('Formato de frequência inválido. Use exemplos como: "8h", "2x por dia", "1.5 horas", etc.')
          setLoading(false)
          return
        }
        
        submitData.frequency_hours = parsedFrequency
      }

      // Validações para doses já tomadas
      if (alreadyTaken) {
        if (!dosesTaken || parseInt(dosesTaken) < 1) {
          setError('Informe quantas doses já foram tomadas')
          setLoading(false)
          return
        }
        
        if (!lastTakenTime) {
          setError('Informe o horário da última dose tomada')
          setLoading(false)
          return
        }
        
        // Adicionar dados das doses já tomadas
        submitData.alreadyTaken = true
        submitData.dosesTaken = parseInt(dosesTaken)
        submitData.lastTakenTime = lastTakenTime
      }

      const result = medication
        ? await medicationsAPI.update(medication.id, submitData)
        : await medicationsAPI.create(submitData)

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

  const handleFrequencyChange = (value) => {
    setFormData(prev => ({
      ...prev,
      frequency_hours: value
    }))
    
    if (value === 'custom') {
      setShowCustomFrequency(true)
      setCustomFrequency('')
    } else {
      setShowCustomFrequency(false)
      setCustomFrequency('')
    }
  }

  const getFrequencyPreview = () => {
    if (!customFrequency) return ''
    
    const parsed = parseCustomFrequency(customFrequency)
    if (!parsed) return '❌ Formato inválido'
    
    let preview = `✅ ${parsed} horas`
    
    // Adicionar contexto útil
    if (parsed < 1) {
      preview += ` (${Math.round(parsed * 60)} minutos)`
    } else if (parsed === 24) {
      preview += ' (1x por dia)'
    } else if (parsed === 12) {
      preview += ' (2x por dia)'
    } else if (parsed === 8) {
      preview += ' (3x por dia)'
    } else if (parsed === 6) {
      preview += ' (4x por dia)'
    } else if (parsed > 24) {
      preview += ` (1x a cada ${Math.round(parsed / 24 * 10) / 10} dias)`
    } else {
      const timesPerDay = Math.round(24 / parsed * 10) / 10
      if (timesPerDay === Math.floor(timesPerDay)) {
        preview += ` (${timesPerDay}x por dia)`
      }
    }
    
    return preview
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
                  onChange={(e) => handleFrequencyChange(e.target.value)}
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
                  <option value="custom">⚙️ Personalizado</option>
                </select>
                
                {/* Campo de frequência personalizada */}
                {showCustomFrequency && (
                  <div className="custom-frequency-container" style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Ex: 8h, 2x por dia, 1.5 horas, 5 dias"
                      value={customFrequency}
                      onChange={(e) => setCustomFrequency(e.target.value)}
                      disabled={loading}
                      className="input-field"
                      style={{ fontSize: '14px' }}
                    />
                    <div className="input-helper" style={{ marginTop: '4px' }}>
                      <Info size={14} />
                      <span>
                        <strong>Formatos aceitos:</strong><br/>
                        • <code>8h</code> ou <code>8 horas</code><br/>
                        • <code>2x por dia</code> ou <code>3 vezes por dia</code><br/>
                        • <code>1.5 dias</code> ou <code>2 semanas</code><br/>
                        • <code>5</code> (assume horas)
                      </span>
                    </div>
                    {customFrequency && (
                      <div className="frequency-preview" style={{ 
                        marginTop: '8px', 
                        padding: '8px', 
                        backgroundColor: 'var(--surface-secondary)', 
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        {getFrequencyPreview()}
                      </div>
                    )}
                  </div>
                )}
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

            {/* Medicação já iniciada */}
            {!medication && (
              <div className="input-group">
                <label className="input-label">
                  Você já tomou essa medicação? *
                </label>
                <div className="radio-group" style={{ 
                  display: 'flex', 
                  gap: 'var(--spacing-md)', 
                  marginTop: 'var(--spacing-sm)' 
                }}>
                  <label className="radio-option" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    cursor: 'pointer',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: !alreadyTaken ? 'var(--color-primary-light)' : 'transparent'
                  }}>
                    <input
                      type="radio"
                      name="alreadyTaken"
                      value="false"
                      checked={!alreadyTaken}
                      onChange={() => {
                        setAlreadyTaken(false)
                        setDosesTaken('')
                        setLastTakenTime('')
                      }}
                      disabled={loading}
                    />
                    <span>Não, é a primeira dose</span>
                  </label>
                  
                  <label className="radio-option" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    cursor: 'pointer',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: alreadyTaken ? 'var(--color-primary-light)' : 'transparent'
                  }}>
                    <input
                      type="radio"
                      name="alreadyTaken"
                      value="true"
                      checked={alreadyTaken}
                      onChange={() => setAlreadyTaken(true)}
                      disabled={loading}
                    />
                    <span>Sim, já comecei o tratamento</span>
                  </label>
                </div>
                
                {/* Campos condicionais para doses já tomadas */}
                {alreadyTaken && (
                  <div className="taken-doses-container" style={{ 
                    marginTop: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--surface-secondary)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div className="input-row">
                      <div className="input-group">
                        <label htmlFor="dosesTaken" className="input-label">
                          Quantas doses já foram tomadas? *
                        </label>
                        <input
                          type="number"
                          id="dosesTaken"
                          name="dosesTaken"
                          min="1"
                          max="100"
                          placeholder="Ex: 3"
                          value={dosesTaken}
                          onChange={(e) => setDosesTaken(e.target.value)}
                          disabled={loading}
                          className="input-field"
                        />
                        <div className="input-helper">
                          <Info size={14} />
                          <span>Conte apenas as doses efetivamente tomadas</span>
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="lastTakenTime" className="input-label">
                          Horário da última dose tomada *
                        </label>
                        <div className="input-with-icon">
                          <Clock className="input-icon" size={16} />
                          <input
                            type="datetime-local"
                            id="lastTakenTime"
                            name="lastTakenTime"
                            value={lastTakenTime}
                            onChange={(e) => setLastTakenTime(e.target.value)}
                            disabled={loading}
                            className="input-field"
                            max={new Date().toISOString().slice(0, 16)}
                          />
                        </div>
                        <div className="input-helper">
                          <Info size={14} />
                          <span>Use esta informação para calcular a próxima dose corretamente</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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