const jwt = require('jsonwebtoken')
const User = require('../models/User')

class AuthController {
  // Registrar usuário
  static async register(req, res) {
    try {
      const { email, password, name } = req.body
      
      // Validações básicas
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, senha e nome são obrigatórios'
        })
      }
      
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Senha deve ter pelo menos 6 caracteres'
        })
      }
      
      // Verificar se usuário já existe
      const existingUser = await User.findByEmail(email)
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Este email já está cadastrado'
        })
      }
      
      // Criar usuário
      const user = await User.create({ email, password, name })
      
      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )
      
      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          token,
          user: user.toJSON()
        }
      })
      
    } catch (error) {
      console.error('[AUTH] Erro no registro:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Login
  static async login(req, res) {
    try {
      const { email, password } = req.body
      
      // Validações básicas
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        })
      }
      
      // Buscar usuário
      const user = await User.findByEmail(email)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha inválidos'
        })
      }
      
      // Verificar senha
      const isValidPassword = await user.verifyPassword(password)
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha inválidos'
        })
      }
      
      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )
      
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token,
          user: user.toJSON()
        }
      })
      
    } catch (error) {
      console.error('[AUTH] Erro no login:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Verificar token
  static async verify(req, res) {
    try {
      // O middleware de auth já verificou o token e adicionou o usuário
      res.json({
        success: true,
        data: {
          user: req.user.toJSON()
        }
      })
    } catch (error) {
      console.error('[AUTH] Erro na verificação:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Atualizar perfil
  static async updateProfile(req, res) {
    try {
      const { name, email, currentPassword, newPassword } = req.body
      const user = req.user
      
      // Se está tentando alterar senha, verificar senha atual
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Senha atual é obrigatória para alterar a senha'
          })
        }
        
        const isValidPassword = await user.verifyPassword(currentPassword)
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: 'Senha atual incorreta'
          })
        }
        
        if (newPassword.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'Nova senha deve ter pelo menos 6 caracteres'
          })
        }
      }
      
      // Se está tentando alterar email, verificar se não existe
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email)
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Este email já está em uso'
          })
        }
      }
      
      // Atualizar usuário
      const updatedUser = await user.update({
        name: name || user.name,
        email: email || user.email,
        password: newPassword
      })
      
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          user: updatedUser.toJSON()
        }
      })
      
    } catch (error) {
      console.error('[AUTH] Erro na atualização:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const user = req.user
      
      // Gerar novo token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )
      
      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          token,
          user: user.toJSON()
        }
      })
      
    } catch (error) {
      console.error('[AUTH] Erro no refresh:', error)
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      })
    }
  }
}

module.exports = AuthController