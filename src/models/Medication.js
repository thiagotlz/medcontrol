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
  static async create({ user_id, name, description, dosage, frequency_hours, start_time }) {
    try {
      const result = await query(
        `INSERT INTO medications (user_id, name, description, dosage, frequency_hours, start_time) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, name, description, dosage, frequency_hours, start_time]
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
}

module.exports = Medication