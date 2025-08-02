const nodemailer = require('nodemailer')

class EmailService {
  // Criar transporter com configurações personalizadas
  static createTransporter(config) {
    return nodemailer.createTransport({
      ...config,
      connectionTimeout: 10000, // 10 segundos
      greetingTimeout: 10000,   // 10 segundos
      socketTimeout: 15000,     // 15 segundos
      debug: false,
      logger: false
    })
  }

  // Enviar email de medicação
  static async sendMedicationReminder(smtpConfig, pushoverEmail, medicationData, userName) {
    try {
      const transporter = this.createTransporter(smtpConfig)
      
      const subject = `💊 Hora do Medicamento: ${medicationData.name}`
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">💊 MedControl</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Lembrete de Medicação</p>
            </div>
            
            <!-- Conteúdo Principal -->
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 20px;">
              <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 22px;">⏰ Hora de tomar seu medicamento!</h2>
              <p style="color: #374151; margin: 0; font-size: 16px;">Olá <strong>${userName}</strong>, está na hora de tomar:</p>
            </div>
            
            <!-- Detalhes do Medicamento -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Medicamento:</td>
                  <td style="padding: 12px 0; color: #111827; font-weight: 700; font-size: 18px;">${medicationData.name}</td>
                </tr>
                ${medicationData.dosage ? `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Dosagem:</td>
                  <td style="padding: 12px 0; color: #111827;">${medicationData.dosage}</td>
                </tr>
                ` : ''}
                ${medicationData.description ? `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Observações:</td>
                  <td style="padding: 12px 0; color: #111827;">${medicationData.description}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">Frequência:</td>
                  <td style="padding: 12px 0; color: #111827;">A cada ${medicationData.frequency_hours} hora(s)</td>
                </tr>
              </table>
            </div>
            
            <!-- Dicas -->
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>💡 Dica:</strong> Lembre-se de tomar com água e seguir as orientações médicas.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Este email foi enviado pelo <strong>MedControl</strong><br>
                Sistema de gerenciamento de medicações
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                Enviado em ${new Date().toLocaleString('pt-BR', { 
                  timeZone: 'America/Sao_Paulo',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      `
      
      const textContent = `
MedControl - Lembrete de Medicação

Olá ${userName}!

⏰ Está na hora de tomar seu medicamento:

Medicamento: ${medicationData.name}
${medicationData.dosage ? `Dosagem: ${medicationData.dosage}` : ''}
${medicationData.description ? `Observações: ${medicationData.description}` : ''}
Frequência: A cada ${medicationData.frequency_hours} hora(s)

💡 Lembre-se de tomar com água e seguir as orientações médicas.

---
MedControl - Sistema de gerenciamento de medicações
Enviado em ${new Date().toLocaleString('pt-BR')}
      `
      
      const mailOptions = {
        from: smtpConfig.auth.user,
        to: pushoverEmail,
        subject: subject,
        text: textContent,
        html: htmlContent
      }
      
      const result = await transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      }
      
    } catch (error) {
      console.error('[EMAIL] Erro ao enviar lembrete:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Enviar email de teste
  static async sendTestEmail(smtpConfig, pushoverEmail, userName) {
    try {
      const transporter = this.createTransporter(smtpConfig)
      
      // Verificar conectividade primeiro
      console.log('[EMAIL] Verificando conectividade SMTP...')
      await transporter.verify()
      console.log('[EMAIL] Conectividade SMTP verificada com sucesso')
      
      const subject = '🧪 Teste de Configuração - MedControl'
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0; font-size: 28px;">🧪 MedControl</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Teste de Configuração</p>
            </div>
            
            <!-- Conteúdo Principal -->
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
              <h2 style="color: #047857; margin: 0 0 15px 0; font-size: 22px;">✅ Configurações funcionando!</h2>
              <p style="color: #374151; margin: 0; font-size: 16px;">Olá <strong>${userName}</strong>, suas configurações de email estão funcionando perfeitamente!</p>
            </div>
            
            <!-- Informações -->
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #0369a1; margin: 0 0 15px 0; font-size: 18px;">📧 Informações do Teste</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px;">
                <li>Servidor SMTP conectado com sucesso</li>
                <li>Email de teste enviado para: <strong>${pushoverEmail}</strong></li>
                <li>Configurações válidas e prontas para uso</li>
                <li>O sistema já pode enviar lembretes de medicação</li>
              </ul>
            </div>
            
            <!-- Próximos Passos -->
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>🎯 Próximo passo:</strong> Cadastre seus medicamentos e o sistema começará a enviar lembretes automaticamente!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Este é um email de teste do <strong>MedControl</strong><br>
                Sistema de gerenciamento de medicações
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                Enviado em ${new Date().toLocaleString('pt-BR', { 
                  timeZone: 'America/Sao_Paulo',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      `
      
      const textContent = `
MedControl - Teste de Configuração

Olá ${userName}!

✅ Suas configurações de email estão funcionando perfeitamente!

📧 Informações do Teste:
- Servidor SMTP conectado com sucesso
- Email de teste enviado para: ${pushoverEmail}
- Configurações válidas e prontas para uso
- O sistema já pode enviar lembretes de medicação

🎯 Próximo passo: Cadastre seus medicamentos e o sistema começará a enviar lembretes automaticamente!

---
MedControl - Sistema de gerenciamento de medicações
Enviado em ${new Date().toLocaleString('pt-BR')}
      `
      
      const mailOptions = {
        from: smtpConfig.auth.user,
        to: pushoverEmail,
        subject: subject,
        text: textContent,
        html: htmlContent
      }
      
      const result = await transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      }
      
    } catch (error) {
      console.error('[EMAIL] Erro ao enviar teste:', error)
      
      let errorMessage = error.message
      
      // Mensagens de erro mais específicas
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Conexão recusada. Verifique o servidor SMTP e a porta.'
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Servidor SMTP não encontrado. Verifique o endereço do servidor.'
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        errorMessage = 'Tempo limite esgotado. Verifique sua conexão com a internet e as configurações do servidor.'
      } else if (error.message.includes('Greeting never received')) {
        errorMessage = 'Não foi possível estabelecer comunicação com o servidor SMTP. Verifique se a porta está correta (587 para TLS, 465 para SSL).'
      } else if (error.message.includes('Invalid login')) {
        errorMessage = 'Credenciais inválidas. Verifique seu email e senha SMTP.'
      } else if (error.message.includes('Authentication failed')) {
        errorMessage = 'Falha na autenticação. Verifique suas credenciais SMTP.'
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message
      }
    }
  }

  // Verificar se as configurações SMTP são válidas
  static async verifyConfig(smtpConfig) {
    try {
      const transporter = this.createTransporter(smtpConfig)
      await transporter.verify()
      return { success: true }
    } catch (error) {
      console.error('[EMAIL] Erro na verificação SMTP:', error)
      return { 
        success: false, 
        error: error.message 
      }
    }
  }
}

module.exports = EmailService