const jwt = require('jsonwebtoken')
const User = require('../models/User')

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      })
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      })
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      // Buscar usuário no banco
      const user = await User.findById(decoded.id)
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado'
        })
      }
      
      // Adicionar usuário à requisição
      req.user = user
      next()
      
    } catch (jwtError) {
      console.error('[AUTH] Erro JWT:', jwtError.message)
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado',
          expired: true
        })
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      })
    }
    
  } catch (error) {
    console.error('[AUTH] Erro no middleware:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
}

// Middleware opcional (não retorna erro se não autenticado)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    if (!token) {
      return next()
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)
      
      if (user) {
        req.user = user
      }
    } catch (jwtError) {
      // Ignorar erros de JWT em auth opcional
    }
    
    next()
    
  } catch (error) {
    // Ignorar erros em auth opcional
    next()
  }
}

module.exports = {
  authMiddleware,
  optionalAuth
}