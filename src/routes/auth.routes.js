const express = require('express')
const AuthController = require('../controllers/AuthController')
const { authMiddleware } = require('../middlewares/auth')

const router = express.Router()

// Rotas públicas
router.post('/register', AuthController.register)
router.post('/login', AuthController.login)

// Rotas protegidas
router.get('/verify', authMiddleware, AuthController.verify)
router.put('/profile', authMiddleware, AuthController.updateProfile)
router.post('/refresh', authMiddleware, AuthController.refreshToken)

module.exports = router