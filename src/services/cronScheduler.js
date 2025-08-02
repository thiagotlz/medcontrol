const cron = require('node-cron')
const MedicationSchedule = require('../models/MedicationSchedule')
const Medication = require('../models/Medication')
const UserSettings = require('../models/UserSettings')
const EmailService = require('./EmailService')
const { query } = require('../config/database')

class CronScheduler {
  constructor() {
    this.tasks = []
    this.isRunning = false
  }

  // Inicializar o agendador
  start() {
    if (this.isRunning) {
      console.log('⚠️ Agendador já está rodando')
      return
    }

    console.log('🚀 Iniciando agendador de medicações...')

    // Verificar notificações a cada minuto
    const notificationTask = cron.schedule('* * * * *', async () => {
      await this.checkPendingNotifications()
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
    })

    // Criar agendamentos futuros a cada hora
    const scheduleTask = cron.schedule('0 * * * *', async () => {
      await this.createFutureSchedules()
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
    })

    // Limpeza de agendamentos antigos uma vez por dia às 02:00
    const cleanupTask = cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldSchedules()
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
    })

    this.tasks = [notificationTask, scheduleTask, cleanupTask]
    this.isRunning = true

    console.log('✅ Agendador iniciado com sucesso')
    console.log('📋 Tarefas configuradas:')
    console.log('  - Verificação de notificações: a cada minuto')
    console.log('  - Criação de agendamentos: a cada hora')
    console.log('  - Limpeza de dados antigos: diariamente às 02:00')
  }

  // Parar o agendador
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Agendador não está rodando')
      return
    }

    console.log('🛑 Parando agendador...')

    this.tasks.forEach(task => {
      if (task) {
        task.stop()
      }
    })

    this.tasks = []
    this.isRunning = false

    console.log('✅ Agendador parado')
  }

  // Verificar notificações pendentes
  async checkPendingNotifications() {
    try {
      // Buscar agendamentos que precisam ser notificados
      const pendingSchedules = await MedicationSchedule.findPendingForNotification(2) // 2 minutos de tolerância

      if (pendingSchedules.length === 0) {
        return
      }

      console.log(`📨 Processando ${pendingSchedules.length} notificação(ões)...`)

      for (const schedule of pendingSchedules) {
        await this.sendNotification(schedule)
      }

    } catch (error) {
      console.error('[CRON] Erro ao verificar notificações:', error)
    }
  }

  // Enviar notificação individual
  async sendNotification(schedule) {
    try {
      // Buscar configurações do usuário
      const settings = await UserSettings.findByUserId(schedule.user_id)

      if (!settings || !settings.areNotificationsEnabled()) {
        console.log(`⚠️ Notificações desabilitadas para usuário ${schedule.user_id}`)
        await schedule.markAsSent() // Marcar como enviado para não tentar novamente
        return
      }

      if (!settings.hasPushoverEmail() || !settings.hasValidSMTPConfig()) {
        console.log(`⚠️ Configurações incompletas para usuário ${schedule.user_id}`)
        await schedule.markAsSent() // Marcar como enviado para não tentar novamente
        return
      }

      // Preparar dados do medicamento
      const medicationData = {
        name: schedule.medication_name,
        description: schedule.description,
        dosage: schedule.dosage,
        frequency_hours: schedule.frequency_hours || 'N/A'
      }

      // Enviar email
      const emailResult = await EmailService.sendMedicationReminder(
        settings.getSMTPConfig(),
        settings.pushover_email,
        medicationData,
        schedule.user_name
      )

      if (emailResult.success) {
        await schedule.markAsSent()
        
        // Log da notificação
        await this.logNotification(schedule.medication_id, schedule.id, 'email', 'sent', 'Email enviado com sucesso')
        
        console.log(`✅ Notificação enviada: ${schedule.medication_name} para ${schedule.user_name}`)
      } else {
        // Log do erro
        await this.logNotification(schedule.medication_id, schedule.id, 'email', 'failed', emailResult.error)
        
        console.error(`❌ Erro ao enviar notificação: ${emailResult.error}`)
      }

    } catch (error) {
      console.error('[CRON] Erro ao enviar notificação:', error)
      
      // Log do erro
      try {
        await this.logNotification(schedule.medication_id, schedule.id, 'email', 'failed', error.message)
      } catch (logError) {
        console.error('[CRON] Erro ao registrar log:', logError)
      }
    }
  }

  // Registrar log de notificação
  async logNotification(medicationId, scheduleId, type, status, message) {
    try {
      await query(
        'INSERT INTO notification_logs (medication_id, schedule_id, type, status, message) VALUES (?, ?, ?, ?, ?)',
        [medicationId, scheduleId, type, status, message]
      )
    } catch (error) {
      console.error('[CRON] Erro ao registrar log de notificação:', error)
    }
  }

  // Criar agendamentos futuros
  async createFutureSchedules() {
    try {
      console.log('🔄 Criando agendamentos futuros...')
      
      const medications = await Medication.findActiveForScheduling()
      let totalCreated = 0

      for (const medication of medications) {
        // Verificar se tem agendamentos suficientes para os próximos 7 dias
        const existingSchedules = await MedicationSchedule.findByMedicationId(medication.id, 50)
        
        // Filtrar agendamentos futuros
        const futureSchedules = existingSchedules.filter(schedule => {
          return new Date(schedule.scheduled_time) > new Date()
        })

        // Se tem menos de 10 agendamentos futuros, criar mais
        if (futureSchedules.length < 10) {
          const nextTimes = medication.getNextScheduleTimes(7)
          
          // Filtrar horários que ainda não foram agendados
          const newTimes = []
          for (const time of nextTimes) {
            const exists = await MedicationSchedule.existsForTime(medication.id, time)
            if (!exists) {
              newTimes.push(time)
            }
          }

          if (newTimes.length > 0) {
            await MedicationSchedule.createMultipleForMedication(medication.id, newTimes)
            totalCreated += newTimes.length
          }
        }
      }

      if (totalCreated > 0) {
        console.log(`✅ Criados ${totalCreated} novos agendamentos`)
      }

    } catch (error) {
      console.error('[CRON] Erro ao criar agendamentos futuros:', error)
    }
  }

  // Limpeza de agendamentos antigos
  async cleanupOldSchedules() {
    try {
      console.log('🧹 Limpando agendamentos antigos...')
      
      const deletedCount = await MedicationSchedule.cleanupOldSchedules(30) // 30 dias
      
      if (deletedCount > 0) {
        console.log(`✅ Removidos ${deletedCount} agendamentos antigos`)
      }

      // Limpar logs antigos também
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 90) // 90 dias

      const [logResult] = await query(
        'DELETE FROM notification_logs WHERE sent_at < ?',
        [cutoffDate]
      )

      if (logResult.affectedRows > 0) {
        console.log(`✅ Removidos ${logResult.affectedRows} logs antigos`)
      }

    } catch (error) {
      console.error('[CRON] Erro na limpeza:', error)
    }
  }

  // Executar tarefa manualmente (para teste)
  async runTask(taskName) {
    console.log(`🔧 Executando tarefa manualmente: ${taskName}`)
    
    switch (taskName) {
      case 'notifications':
        await this.checkPendingNotifications()
        break
      case 'schedules':
        await this.createFutureSchedules()
        break
      case 'cleanup':
        await this.cleanupOldSchedules()
        break
      default:
        console.log('❌ Tarefa não encontrada')
    }
  }

  // Status do agendador
  getStatus() {
    return {
      isRunning: this.isRunning,
      tasksCount: this.tasks.length,
      uptime: this.isRunning ? 'Rodando' : 'Parado'
    }
  }
}

// Singleton
const cronScheduler = new CronScheduler()

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Recebido SIGINT, parando agendador...')
  cronScheduler.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido SIGTERM, parando agendador...')
  cronScheduler.stop()
  process.exit(0)
})

module.exports = cronScheduler