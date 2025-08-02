const UserSettings = require('../models/UserSettings')

class SettingsController {
  // Obter configurações do usuário
  static async get(req, res) {
    try {
      const userId = req.user.id
      
      let settings = await UserSettings.findByUserId(userId)
      
      // Se não existir, criar configurações padrão
      if (!settings) {
        settings = await UserSettings.createDefault(userId)
      }
      
      res.json({
        success: true,
        data: settings.toJSON()
      })
      
    } catch (error) {
      console.error('[SETTINGS] Erro ao obter configurações:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Atualizar configurações
  static async update(req, res) {
    try {
      const userId = req.user.id
      const { 
        pushover_email, 
        smtp_host, 
        smtp_port, 
        smtp_secure, 
        smtp_user, 
        smtp_password,
        notifications_enabled 
      } = req.body
      
      // Validações
      if (pushover_email !== undefined && pushover_email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(pushover_email)) {
          return res.status(400).json({
            success: false,
            message: 'Email do Pushover inválido'
          })
        }
      }
      
      if (smtp_port !== undefined && smtp_port) {
        const port = parseInt(smtp_port)
        if (isNaN(port) || port < 1 || port > 65535) {
          return res.status(400).json({
            success: false,
            message: 'Porta SMTP deve ser um número entre 1 e 65535'
          })
        }
      }
      
      if (smtp_user !== undefined && smtp_user) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(smtp_user)) {
          return res.status(400).json({
            success: false,
            message: 'Email SMTP inválido'
          })
        }
      }
      
      // Atualizar configurações
      const updatedSettings = await UserSettings.updateByUserId(userId, {
        pushover_email: pushover_email?.trim() || null,
        smtp_host: smtp_host?.trim() || null,
        smtp_port: smtp_port ? parseInt(smtp_port) : null,
        smtp_secure: smtp_secure === true || smtp_secure === 'true',
        smtp_user: smtp_user?.trim() || null,
        smtp_password: smtp_password?.trim() || null,
        notifications_enabled: notifications_enabled === true || notifications_enabled === 'true'
      })
      
      res.json({
        success: true,
        message: 'Configurações atualizadas com sucesso',
        data: updatedSettings.toJSON()
      })
      
    } catch (error) {
      console.error('[SETTINGS] Erro ao atualizar configurações:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Testar configurações SMTP
  static async testSMTP(req, res) {
    try {
      const userId = req.user.id
      
      const settings = await UserSettings.findByUserId(userId)
      
      if (!settings || !settings.hasValidSMTPConfig()) {
        return res.status(400).json({
          success: false,
          message: 'Configurações SMTP incompletas'
        })
      }
      
      if (!settings.hasPushoverEmail()) {
        return res.status(400).json({
          success: false,
          message: 'Email do Pushover não configurado'
        })
      }
      
      // Importar e usar o serviço de email
      const EmailService = require('../services/EmailService')
      
      const testResult = await EmailService.sendTestEmail(
        settings.getSMTPConfig(),
        settings.pushover_email,
        req.user.name || req.user.email
      )
      
      if (testResult.success) {
        res.json({
          success: true,
          message: 'Email de teste enviado com sucesso!'
        })
      } else {
        res.status(400).json({
          success: false,
          message: testResult.error || 'Erro ao enviar email de teste'
        })
      }
      
    } catch (error) {
      console.error('[SETTINGS] Erro ao testar SMTP:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Verificar status das configurações
  static async getStatus(req, res) {
    try {
      const userId = req.user.id
      
      const settings = await UserSettings.findByUserId(userId)
      
      const status = {
        hasSettings: !!settings,
        hasPushoverEmail: settings ? settings.hasPushoverEmail() : false,
        hasSMTPConfig: settings ? settings.hasValidSMTPConfig() : false,
        notificationsEnabled: settings ? settings.areNotificationsEnabled() : false,
        isFullyConfigured: false
      }
      
      status.isFullyConfigured = status.hasPushoverEmail && 
                                 status.hasSMTPConfig && 
                                 status.notificationsEnabled
      
      res.json({
        success: true,
        data: status
      })
      
    } catch (error) {
      console.error('[SETTINGS] Erro ao verificar status:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }
}

module.exports = SettingsController