const express = require('express')
const MedicationController = require('../controllers/MedicationController')
const { authMiddleware } = require('../middlewares/auth')

const router = express.Router()

// Todas as rotas precisam de autenticação
router.use(authMiddleware)

// CRUD de medicamentos
router.get('/', MedicationController.list)
router.get('/stats', MedicationController.getStats)
router.get('/:id', MedicationController.get)
router.post('/', MedicationController.create)
router.put('/:id', MedicationController.update)
router.delete('/:id', MedicationController.delete)
router.patch('/:id/toggle', MedicationController.toggle)

// Agendamentos
router.get('/:id/schedules', MedicationController.getSchedules)

module.exports = router