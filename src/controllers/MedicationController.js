const Medication = require('../models/Medication')
const MedicationSchedule = require('../models/MedicationSchedule')

class MedicationController {
  // Listar medicamentos do usuário
  static async list(req, res) {
    try {
      const userId = req.user.id
      const { active } = req.query
      
      const medications = await Medication.findByUserId(
        userId, 
        active !== 'false' // Por padrão, mostrar apenas ativos
      )
      
      // Adicionar informações de progresso
      const medicationsWithProgress = medications.map(medication => {
        // Converter instância para objeto plain
        const medicationData = {
          id: medication.id,
          user_id: medication.user_id,
          name: medication.name,
          description: medication.description,
          dosage: medication.dosage,
          frequency_hours: medication.frequency_hours,
          start_time: medication.start_time,
          duration_days: medication.duration_days,
          started_at: medication.started_at,
          active: medication.active,
          created_at: medication.created_at,
          updated_at: medication.updated_at
        }
        
        return {
          ...medicationData,
          progress: medication.getProgress(),
          treatmentStatus: medication.getTreatmentStatus()
        }
      })
      
      res.json({
        success: true,
        data: medicationsWithProgress
      })
      
    } catch (error) {
      console.error('[MEDICATION] Erro ao listar:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Obter medicamento específico
  static async get(req, res) {
    try {
      const { id } = req.params
      const userId = req.user.id
      
      const medication = await Medication.findById(id)
      
      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medicamento não encontrado'
        })
      }
      
      // Verificar se pertence ao usuário
      if (!medication.belongsToUser(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        })
      }
      
      const medicationData = {
        id: medication.id,
        user_id: medication.user_id,
        name: medication.name,
        description: medication.description,
        dosage: medication.dosage,
        frequency_hours: medication.frequency_hours,
        start_time: medication.start_time,
        duration_days: medication.duration_days,
        started_at: medication.started_at,
        active: medication.active,
        created_at: medication.created_at,
        updated_at: medication.updated_at
      }
      
      res.json({
        success: true,
        data: {
          ...medicationData,
          progress: medication.getProgress(),
          treatmentStatus: medication.getTreatmentStatus()
        }
      })
      
    } catch (error) {
      console.error('[MEDICATION] Erro ao obter:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Criar medicamento
  static async create(req, res) {
    try {
      const { 
        name, description, dosage, frequency_hours, start_time, duration_days,
        alreadyTaken, dosesTaken, lastTakenTime 
      } = req.body
      const userId = req.user.id
      
      // Validações
      if (!name || !frequency_hours || !start_time) {
        return res.status(400).json({
          success: false,
          message: 'Nome, frequência em horas e horário inicial são obrigatórios'
        })
      }
      
      if (frequency_hours < 0.5 || frequency_hours > 8760) { // 30 minutos a 1 ano
        return res.status(400).json({
          success: false,
          message: 'Frequência deve ser entre 0.5 e 8760 horas'
        })
      }
      
      // Validar formato do horário (HH:MM ou H:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!start_time || !timeRegex.test(start_time.trim())) {
        return res.status(400).json({
          success: false,
          message: `Formato de horário inválido. Recebido: "${start_time}". Use HH:MM (ex: 08:30, 14:00)`
        })
      }

      // Validação de duration_days se fornecido
      if (duration_days !== undefined && duration_days !== null && duration_days !== '') {
        const days = parseInt(duration_days)
        if (isNaN(days) || days < 1 || days > 365) {
          return res.status(400).json({
            success: false,
            message: 'Duração deve ser entre 1 e 365 dias'
          })
        }
      }

      // Validações para doses já tomadas
      if (alreadyTaken) {
        if (!dosesTaken || dosesTaken < 1) {
          return res.status(400).json({
            success: false,
            message: 'Número de doses tomadas é obrigatório quando o tratamento já foi iniciado'
          })
        }
        
        if (!lastTakenTime) {
          return res.status(400).json({
            success: false,
            message: 'Horário da última dose é obrigatório quando o tratamento já foi iniciado'
          })
        }
        
        // Validar se a data da última dose não é futura
        const lastTaken = new Date(lastTakenTime)
        if (isNaN(lastTaken.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Formato de data/hora inválido para a última dose'
          })
        }
        
        if (lastTaken > new Date()) {
          return res.status(400).json({
            success: false,
            message: 'O horário da última dose não pode ser no futuro'
          })
        }
        
        // Validar se a data não é muito antiga (mais de 1 ano)
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        if (lastTaken < oneYearAgo) {
          return res.status(400).json({
            success: false,
            message: 'O horário da última dose não pode ser anterior a 1 ano'
          })
        }
      }
      
      // Criar medicamento
      const medication = await Medication.create({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        dosage: dosage?.trim() || null,
        frequency_hours: parseFloat(frequency_hours),
        start_time,
        duration_days: duration_days ? parseInt(duration_days) : null
      })
      
      // Se já tomou doses, criar registros históricos e calcular próxima dose baseada na última
      if (alreadyTaken) {
        const lastTaken = new Date(lastTakenTime)
        const frequencyMs = parseFloat(frequency_hours) * 60 * 60 * 1000
        
        // Criar registros para as doses já tomadas
        const takenSchedules = []
        for (let i = 0; i < dosesTaken; i++) {
          const scheduleTime = new Date(lastTaken.getTime() - (frequencyMs * (dosesTaken - 1 - i)))
          takenSchedules.push({
            medication_id: medication.id,
            scheduled_time: scheduleTime,
            status: 'taken',
            taken_at: scheduleTime
          })
        }
        
        if (takenSchedules.length > 0) {
          await MedicationSchedule.createMultiple(takenSchedules)
        }
        
        // Criar próximos agendamentos baseados na última dose
        const nextScheduleTime = new Date(lastTaken.getTime() + frequencyMs)
        const scheduleTimes = []
        
        for (let i = 0; i < 7; i++) {
          const scheduleTime = new Date(nextScheduleTime.getTime() + (frequencyMs * i))
          scheduleTimes.push(scheduleTime)
        }
        
        await MedicationSchedule.createMultipleForMedication(medication.id, scheduleTimes)
      } else {
        // Criar agendamentos iniciais normais (próximos 7 dias)
        const scheduleTimes = medication.getNextScheduleTimes(7)
        await MedicationSchedule.createMultipleForMedication(medication.id, scheduleTimes)
      }
      
      const medicationData = {
        id: medication.id,
        user_id: medication.user_id,
        name: medication.name,
        description: medication.description,
        dosage: medication.dosage,
        frequency_hours: medication.frequency_hours,
        start_time: medication.start_time,
        duration_days: medication.duration_days,
        started_at: medication.started_at,
        active: medication.active,
        created_at: medication.created_at,
        updated_at: medication.updated_at
      }
      
      res.status(201).json({
        success: true,
        message: 'Medicamento criado com sucesso',
        data: {
          ...medicationData,
          progress: medication.getProgress(),
          treatmentStatus: medication.getTreatmentStatus()
        }
      })
      
    } catch (error) {
      console.error('[MEDICATION] Erro ao criar:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Atualizar medicamento
  static async update(req, res) {
    try {
      const { id } = req.params
      const { name, description, dosage, frequency_hours, start_time, duration_days, active } = req.body
      const userId = req.user.id
      
      console.log('[UPDATE] Dados recebidos:', { 
        name, 
        description, 
        dosage, 
        frequency_hours, 
        start_time, 
        duration_days, 
        active 
      })
      
      const medication = await Medication.findById(id)
      
      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medicamento não encontrado'
        })
      }
      
      // Verificar se pertence ao usuário
      if (!medication.belongsToUser(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        })
      }
      
      // Validações se fornecidos
      if (frequency_hours && (frequency_hours < 0.5 || frequency_hours > 8760)) {
        return res.status(400).json({
          success: false,
          message: 'Frequência deve ser entre 0.5 e 8760 horas'
        })
      }
      
      if (start_time) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(start_time)) {
          return res.status(400).json({
            success: false,
            message: 'Formato de horário inválido. Use HH:MM'
          })
        }
      }

      // Validação de duration_days se fornecido
      if (duration_days !== undefined && duration_days !== null && duration_days !== '') {
        const days = parseInt(duration_days)
        if (isNaN(days) || days < 1 || days > 365) {
          return res.status(400).json({
            success: false,
            message: 'Duração deve ser entre 1 e 365 dias'
          })
        }
      }
      
      // Atualizar medicamento
      const updatedMedication = await medication.update({
        name: name?.trim(),
        description: description?.trim(),
        dosage: dosage?.trim(),
        frequency_hours: frequency_hours ? parseFloat(frequency_hours) : undefined,
        start_time,
        duration_days: duration_days !== undefined ? (duration_days ? parseInt(duration_days) : null) : undefined,
        active
      })
      
      // Se mudou frequência ou horário, recriar agendamentos futuros
      if (frequency_hours || start_time) {
        // Cancelar agendamentos pendentes futuros
        const futureSchedules = await MedicationSchedule.findByMedicationId(id, 100)
        for (const schedule of futureSchedules) {
          if (schedule.status === 'pending' && new Date(schedule.scheduled_time) > new Date()) {
            await schedule.delete()
          }
        }
        
        // Criar novos agendamentos
        const scheduleTimes = updatedMedication.getNextScheduleTimes(7)
        await MedicationSchedule.createMultipleForMedication(id, scheduleTimes)
      }
      
      const medicationData = {
        id: updatedMedication.id,
        user_id: updatedMedication.user_id,
        name: updatedMedication.name,
        description: updatedMedication.description,
        dosage: updatedMedication.dosage,
        frequency_hours: updatedMedication.frequency_hours,
        start_time: updatedMedication.start_time,
        duration_days: updatedMedication.duration_days,
        started_at: updatedMedication.started_at,
        active: updatedMedication.active,
        created_at: updatedMedication.created_at,
        updated_at: updatedMedication.updated_at
      }
      
      res.json({
        success: true,
        message: 'Medicamento atualizado com sucesso',
        data: {
          ...medicationData,
          progress: updatedMedication.getProgress(),
          treatmentStatus: updatedMedication.getTreatmentStatus()
        }
      })
      
    } catch (error) {
      console.error('[MEDICATION] Erro ao atualizar:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Deletar medicamento
  static async delete(req, res) {
    try {
      const { id } = req.params
      const userId = req.user.id
      
      const medication = await Medication.findById(id)
      
      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medicamento não encontrado'
        })
      }
      
      // Verificar se pertence ao usuário
      if (!medication.belongsToUser(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        })
      }
      
      await medication.delete()
      
      res.json({
        success: true,
        message: 'Medicamento excluído com sucesso'
      })
      
    } catch (error) {
      console.error('[MEDICATION] Erro ao deletar:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Ativar/Desativar medicamento
  static async toggle(req, res) {
    try {
      const { id } = req.params
      const userId = req.user.id
      
      const medication = await Medication.findById(id)
      
      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medicamento não encontrado'
        })
      }
      
      // Verificar se pertence ao usuário
      if (!medication.belongsToUser(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        })
      }
      
      const updatedMedication = await medication.toggleActive()
      
      // Se ativou, criar novos agendamentos
      if (updatedMedication.active) {
        const scheduleTimes = updatedMedication.getNextScheduleTimes(7)
        await MedicationSchedule.createMultipleForMedication(id, scheduleTimes)
      }
      
      res.json({
        success: true,
        message: `Medicamento ${updatedMedication.active ? 'ativado' : 'desativado'} com sucesso`,
        data: updatedMedication
      })
      
    } catch (error) {
      console.error('[MEDICATION] Erro ao alternar:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Obter próximos agendamentos
  static async getSchedules(req, res) {
    try {
      const { id } = req.params
      const userId = req.user.id
      const { limit = 10 } = req.query
      
      const medication = await Medication.findById(id)
      
      if (!medication) {
        return res.status(404).json({
          success: false,
          message: 'Medicamento não encontrado'
        })
      }
      
      // Verificar se pertence ao usuário
      if (!medication.belongsToUser(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        })
      }
      
      const schedules = await MedicationSchedule.findByMedicationId(id, parseInt(limit))
      
      res.json({
        success: true,
        data: schedules
      })
      
    } catch (error) {
      console.error('[MEDICATION] Erro ao obter agendamentos:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Estatísticas do usuário
  static async getStats(req, res) {
    try {
      const userId = req.user.id
      const { days = 30 } = req.query
      
      const stats = await MedicationSchedule.getUserStats(userId, parseInt(days))
      
      // Calcular taxa de adesão
      const adherenceRate = stats.total > 0 
        ? Math.round((stats.taken / (stats.taken + stats.missed)) * 100) || 0
        : 0
      
      res.json({
        success: true,
        data: {
          ...stats,
          adherenceRate,
          period: parseInt(days)
        }
      })
      
    } catch (error) {
      console.error('[MEDICATION] Erro ao obter estatísticas:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }
}

module.exports = MedicationController