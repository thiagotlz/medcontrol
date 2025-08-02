const { query } = require('../config/database')

class Medication {
  constructor(data) {
    this.id = data.id
    this.user_id = data.user_id
    this.name = data.name
    this.description = data.description
    this.dosage = data.dosage
    this.frequency_hours = data.frequency_hours
    this.start_time = data.start_time
    this.active = data.active
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  // Criar medicamento
  static async create({ user_id, name, description, dosage, frequency_hours, start_time, duration_days }) {
    try {
      const started_at = duration_days ? new Date().toISOString().split('T')[0] : null
      
      const result = await query(
        `INSERT INTO medications (user_id, name, description, dosage, frequency_hours, start_time, duration_days, started_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, name, description, dosage, frequency_hours, start_time, duration_days, started_at]
      )
      
      return await Medication.findById(result.insertId)
    } catch (error) {
      throw error
    }
  }

  // Buscar por ID
  static async findById(id) {
    try {
      const medications = await query('SELECT * FROM medications WHERE id = ?', [id])
      return medications.length > 0 ? new Medication(medications[0]) : null
    } catch (error) {
      throw error
    }
  }

  // Buscar por usuário
  static async findByUserId(userId, activeOnly = true) {
    try {
      const sql = activeOnly 
        ? 'SELECT * FROM medications WHERE user_id = ? AND active = true ORDER BY created_at DESC'
        : 'SELECT * FROM medications WHERE user_id = ? ORDER BY created_at DESC'
      
      const medications = await query(sql, [userId])
      return medications.map(med => new Medication(med))
    } catch (error) {
      throw error
    }
  }

  // Buscar medicamentos ativos para agendamento
  static async findActiveForScheduling() {
    try {
      const medications = await query(`
        SELECT m.*, u.email, u.name as user_name 
        FROM medications m
        JOIN users u ON m.user_id = u.id
        WHERE m.active = true
        ORDER BY m.start_time ASC
      `)
      
      return medications.map(med => new Medication(med))
    } catch (error) {
      throw error
    }
  }

  // Atualizar medicamento
  async update(data) {
    try {
      const fields = []
      const values = []
      
      if (data.name !== undefined) {
        fields.push('name = ?')
        values.push(data.name)
      }
      
      if (data.description !== undefined) {
        fields.push('description = ?')
        values.push(data.description)
      }
      
      if (data.dosage !== undefined) {
        fields.push('dosage = ?')
        values.push(data.dosage)
      }
      
      if (data.frequency_hours !== undefined) {
        fields.push('frequency_hours = ?')
        values.push(data.frequency_hours)
      }
      
      if (data.start_time !== undefined) {
        fields.push('start_time = ?')
        values.push(data.start_time)
      }
      
      if (data.duration_days !== undefined) {
        fields.push('duration_days = ?')
        values.push(data.duration_days)
        
        // Se está definindo duration_days pela primeira vez, definir started_at
        if (data.duration_days && !this.started_at) {
          fields.push('started_at = ?')
          values.push(new Date().toISOString().split('T')[0])
        }
      }
      
      if (data.active !== undefined) {
        fields.push('active = ?')
        values.push(data.active)
      }
      
      if (fields.length === 0) {
        return this
      }
      
      values.push(this.id)
      
      await query(
        `UPDATE medications SET ${fields.join(', ')} WHERE id = ?`,
        values
      )
      
      return await Medication.findById(this.id)
    } catch (error) {
      throw error
    }
  }

  // Deletar medicamento
  async delete() {
    try {
      await query('DELETE FROM medications WHERE id = ?', [this.id])
      return true
    } catch (error) {
      throw error
    }
  }

  // Ativar/Desativar medicamento
  async toggleActive() {
    try {
      const newStatus = !this.active
      await query('UPDATE medications SET active = ? WHERE id = ?', [newStatus, this.id])
      this.active = newStatus
      return this
    } catch (error) {
      throw error
    }
  }

  // Calcular próximos horários
  getNextScheduleTimes(days = 7) {
    const times = []
    const now = new Date()
    const [hours, minutes] = this.start_time.split(':').map(Number)
    
    // Começar do próximo horário possível
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    
    // Se o horário de hoje já passou, começar amanhã
    if (startDate <= now) {
      startDate.setDate(startDate.getDate() + 1)
    }
    
    let currentTime = new Date(startDate)
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + days)
    
    while (currentTime <= endDate) {
      times.push(new Date(currentTime))
      currentTime.setHours(currentTime.getHours() + this.frequency_hours)
    }
    
    return times
  }

  // Verificar se pertence ao usuário
  belongsToUser(userId) {
    return this.user_id === userId
  }

  // Calcular progresso do tratamento
  getProgress() {
    if (!this.duration_days || !this.started_at) {
      return null
    }

    const startDate = new Date(this.started_at)
    const currentDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + this.duration_days)

    const totalDays = this.duration_days
    const daysPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.max(0, totalDays - daysPassed)
    
    const progressPercentage = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100))

    return {
      totalDays,
      daysPassed: Math.max(0, daysPassed),
      daysRemaining,
      progressPercentage: Math.round(progressPercentage),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      isCompleted: daysPassed >= totalDays,
      isActive: daysPassed >= 0 && daysPassed < totalDays
    }
  }

  // Verificar se o tratamento está ativo
  isTreatmentActive() {
    const progress = this.getProgress()
    return progress ? progress.isActive : true
  }

  // Obter status do tratamento
  getTreatmentStatus() {
    if (!this.duration_days) {
      return 'continuous' // Tratamento contínuo
    }

    const progress = this.getProgress()
    if (!progress) return 'not_started'

    if (progress.isCompleted) return 'completed'
    if (progress.isActive) return 'active'
    return 'not_started'
  }
}

module.exports = Medication