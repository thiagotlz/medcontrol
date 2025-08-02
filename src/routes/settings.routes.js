const express = require('express')
const SettingsController = require('../controllers/SettingsController')
const { authMiddleware } = require('../middlewares/auth')

const router = express.Router()

// Todas as rotas precisam de autenticação
router.use(authMiddleware)

// Configurações do usuário
router.get('/', SettingsController.get)
router.put('/', SettingsController.update)
router.get('/status', SettingsController.getStatus)
router.post('/test-smtp', SettingsController.testSMTP)

module.exports = router