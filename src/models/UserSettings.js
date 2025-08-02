const { query } = require('../config/database')

class UserSettings {
  constructor(data) {
    this.id = data.id
    this.user_id = data.user_id
    this.pushover_email = data.pushover_email
    this.smtp_host = data.smtp_host
    this.smtp_port = data.smtp_port
    this.smtp_secure = data.smtp_secure
    this.smtp_user = data.smtp_user
    this.smtp_password = data.smtp_password
    this.notifications_enabled = data.notifications_enabled
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  // Buscar configurações do usuário
  static async findByUserId(userId) {
    try {
      const settings = await query('SELECT * FROM user_settings WHERE user_id = ?', [userId])
      return settings.length > 0 ? new UserSettings(settings[0]) : null
    } catch (error) {
      throw error
    }
  }

  // Criar configurações padrão para o usuário
  static async createDefault(userId) {
    try {
      const result = await query(
        `INSERT INTO user_settings (user_id, notifications_enabled) VALUES (?, ?)`,
        [userId, true]
      )
      
      return await UserSettings.findByUserId(userId)
    } catch (error) {
      throw error
    }
  }

  // Atualizar configurações
  static async updateByUserId(userId, data) {
    try {
      // Verificar se já existe configuração
      let settings = await UserSettings.findByUserId(userId)
      
      if (!settings) {
        settings = await UserSettings.createDefault(userId)
      }
      
      const fields = []
      const values = []
      
      if (data.pushover_email !== undefined) {
        fields.push('pushover_email = ?')
        values.push(data.pushover_email)
      }
      
      if (data.smtp_host !== undefined) {
        fields.push('smtp_host = ?')
        values.push(data.smtp_host)
      }
      
      if (data.smtp_port !== undefined) {
        fields.push('smtp_port = ?')
        values.push(data.smtp_port)
      }
      
      if (data.smtp_secure !== undefined) {
        fields.push('smtp_secure = ?')
        values.push(data.smtp_secure)
      }
      
      if (data.smtp_user !== undefined) {
        fields.push('smtp_user = ?')
        values.push(data.smtp_user)
      }
      
      if (data.smtp_password !== undefined && data.smtp_password !== null) {
        fields.push('smtp_password = ?')
        values.push(data.smtp_password)
      }
      
      if (data.notifications_enabled !== undefined) {
        fields.push('notifications_enabled = ?')
        values.push(data.notifications_enabled)
      }
      
      if (fields.length === 0) {
        return settings
      }
      
      values.push(userId)
      
      await query(
        `UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`,
        values
      )
      
      return await UserSettings.findByUserId(userId)
    } catch (error) {
      throw error
    }
  }

  // Verificar se tem configurações SMTP válidas
  hasValidSMTPConfig() {
    return !!(this.smtp_host && this.smtp_port && this.smtp_user && this.smtp_password)
  }

  // Verificar se tem email do Pushover configurado
  hasPushoverEmail() {
    return !!(this.pushover_email && this.pushover_email.trim())
  }

  // Verificar se notificações estão habilitadas
  areNotificationsEnabled() {
    return this.notifications_enabled === true || this.notifications_enabled === 1
  }

  // Obter configurações SMTP formatadas
  getSMTPConfig() {
    if (!this.hasValidSMTPConfig()) {
      return null
    }
    
    return {
      host: this.smtp_host,
      port: parseInt(this.smtp_port),
      secure: this.smtp_secure === true || this.smtp_secure === 1,
      auth: {
        user: this.smtp_user,
        pass: this.smtp_password
      }
    }
  }

  // Serializar removendo dados sensíveis
  toJSON() {
    const { smtp_password, ...settingsWithoutPassword } = this
    return {
      ...settingsWithoutPassword,
      smtp_password: this.smtp_password ? '***' : null
    }
  }
}

module.exports = UserSettings