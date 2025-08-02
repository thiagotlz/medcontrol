require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const path = require('path')
const cronScheduler = require('./src/services/cronScheduler')

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))

app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Muitas tentativas, tente novamente em 15 minutos.'
})
app.use('/api/', limiter)

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'))
app.use('/api/medications', require('./src/routes/medication.routes'))
app.use('/api/settings', require('./src/routes/settings.routes'))

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'))
  })
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack)
  res.status(500).json({ 
    success: false, 
    message: 'Erro interno do servidor' 
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Rota não encontrada' 
  })
})

// Inicializar banco de dados
const { initializeDatabase } = require('./src/config/database')

// Inicializar servidor
const startServer = async () => {
  try {
    // Inicializar banco de dados
    const dbInitialized = await initializeDatabase()
    
    if (!dbInitialized) {
      console.error('❌ Falha ao inicializar banco de dados')
      process.exit(1)
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`)
      console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`)
      
      // Inicializar agendador de tarefas
      cronScheduler.start()
      console.log('⏰ Agendador de medicações iniciado')
    })
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error)
    process.exit(1)
  }
}

startServer()

module.exports = app