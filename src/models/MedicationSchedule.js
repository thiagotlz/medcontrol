const { query } = require('../config/database')

class MedicationSchedule {
  constructor(data) {
    this.id = data.id
    this.medication_id = data.medication_id
    this.scheduled_time = data.scheduled_time
    this.status = data.status
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  // Criar agendamento
  static async create({ medication_id, scheduled_time }) {
    try {
      const result = await query(
        'INSERT INTO medication_schedules (medication_id, scheduled_time) VALUES (?, ?)',
        [medication_id, scheduled_time]
      )
      
      return await MedicationSchedule.findById(result.insertId)
    } catch (error) {
      throw error
    }
  }

  // Buscar por ID
  static async findById(id) {
    try {
      const schedules = await query('SELECT * FROM medication_schedules WHERE id = ?', [id])
      return schedules.length > 0 ? new MedicationSchedule(schedules[0]) : null
    } catch (error) {
      throw error
    }
  }

  // Buscar agendamentos pendentes para envio
  static async findPendingForNotification(timeRange = 5) {
    try {
      const now = new Date()
      const targetTime = new Date(now.getTime() + (timeRange * 60 * 1000)) // 5 minutos à frente
      
      const schedules = await query(`
        SELECT 
          ms.*,
          m.name as medication_name,
          m.description,
          m.dosage,
          m.user_id,
          u.email,
          u.name as user_name
        FROM medication_schedules ms
        JOIN medications m ON ms.medication_id = m.id
        JOIN users u ON m.user_id = u.id
        WHERE ms.status = 'pending'
          AND ms.scheduled_time <= ?
          AND ms.scheduled_time >= ?
          AND m.active = true
        ORDER BY ms.scheduled_time ASC
      `, [targetTime, now])
      
      return schedules.map(schedule => new MedicationSchedule(schedule))
    } catch (error) {
      throw error
    }
  }

  // Buscar por medicamento
  static async findByMedicationId(medicationId, limit = 10) {
    try {
      // Garantir que limit é um número inteiro válido
      const safeLimit = parseInt(limit) || 10
      
      const schedules = await query(
        `SELECT * FROM medication_schedules 
         WHERE medication_id = ? 
         ORDER BY scheduled_time DESC 
         LIMIT ${safeLimit}`,
        [medicationId]
      )
      
      return schedules.map(schedule => new MedicationSchedule(schedule))
    } catch (error) {
      throw error
    }
  }

  // Buscar por usuário
  static async findByUserId(userId, status = null, limit = 20) {
    try {
      let sql = `
        SELECT ms.*, m.name as medication_name, m.description, m.dosage
        FROM medication_schedules ms
        JOIN medications m ON ms.medication_id = m.id
        WHERE m.user_id = ?
      `
      const params = [userId]
      
      if (status) {
        sql += ' AND ms.status = ?'
        params.push(status)
      }
      
      sql += ' ORDER BY ms.scheduled_time DESC LIMIT ?'
      params.push(limit)
      
      const schedules = await query(sql, params)
      return schedules.map(schedule => new MedicationSchedule(schedule))
    } catch (error) {
      throw error
    }
  }

  // Atualizar status
  async updateStatus(status) {
    try {
      await query(
        'UPDATE medication_schedules SET status = ? WHERE id = ?',
        [status, this.id]
      )
      
      this.status = status
      return this
    } catch (error) {
      throw error
    }
  }

  // Marcar como enviado
  async markAsSent() {
    return await this.updateStatus('sent')
  }

  // Marcar como tomado
  async markAsTaken() {
    return await this.updateStatus('taken')
  }

  // Marcar como perdido
  async markAsMissed() {
    return await this.updateStatus('missed')
  }

  // Deletar agendamento
  async delete() {
    try {
      await query('DELETE FROM medication_schedules WHERE id = ?', [this.id])
      return true
    } catch (error) {
      throw error
    }
  }

  // Criar múltiplos agendamentos para um medicamento
  static async createMultipleForMedication(medicationId, scheduleTimes) {
    try {
      const schedules = []
      
      for (const time of scheduleTimes) {
        const schedule = await MedicationSchedule.create({
          medication_id: medicationId,
          scheduled_time: time
        })
        schedules.push(schedule)
      }
      
      return schedules
    } catch (error) {
      throw error
    }
  }

  // Criar múltiplos agendamentos com dados completos
  static async createMultiple(schedulesData) {
    try {
      const schedules = []
      
      for (const scheduleData of schedulesData) {
        const result = await query(
          `INSERT INTO medication_schedules 
           (medication_id, scheduled_time, status, taken_at) 
           VALUES (?, ?, ?, ?)`,
          [
            scheduleData.medication_id,
            scheduleData.scheduled_time,
            scheduleData.status || 'pending',
            scheduleData.taken_at || null
          ]
        )
        
        const schedule = await MedicationSchedule.findById(result.insertId)
        schedules.push(schedule)
      }
      
      return schedules
    } catch (error) {
      throw error
    }
  }

  // Limpar agendamentos antigos
  static async cleanupOldSchedules(daysOld = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      
      const result = await query(
        'DELETE FROM medication_schedules WHERE scheduled_time < ? AND status IN ("sent", "taken", "missed")',
        [cutoffDate]
      )
      
      return result.affectedRows || 0
    } catch (error) {
      throw error
    }
  }

  // Verificar se existe agendamento para o horário
  static async existsForTime(medicationId, scheduledTime) {
    try {
      const schedules = await query(
        'SELECT id FROM medication_schedules WHERE medication_id = ? AND scheduled_time = ?',
        [medicationId, scheduledTime]
      )
      
      return schedules.length > 0
    } catch (error) {
      throw error
    }
  }

  // Estatísticas do usuário
  static async getUserStats(userId, days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const stats = await query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken,
          SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM medication_schedules ms
        JOIN medications m ON ms.medication_id = m.id
        WHERE m.user_id = ? AND ms.scheduled_time >= ?
      `, [userId, startDate])
      
      return stats[0] || {
        total: 0,
        taken: 0,
        missed: 0,
        sent: 0,
        pending: 0
      }
    } catch (error) {
      throw error
    }
  }
}

module.exports = MedicationSchedule