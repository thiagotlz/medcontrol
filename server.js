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

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Servidor funcionando',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
})

// Debug route para verificar arquivos
app.get('/debug', (req, res) => {
  const fs = require('fs')
  const clientDistPath = path.join(__dirname, 'client/dist')
  const indexExists = fs.existsSync(path.join(clientDistPath, 'index.html'))
  
  res.json({
    success: true,
    clientDistPath,
    indexExists,
    files: fs.existsSync(clientDistPath) ? fs.readdirSync(clientDistPath) : 'Directory not found',
    environment: process.env.NODE_ENV
  })
})

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'))
app.use('/api/medications', require('./src/routes/medication.routes'))
app.use('/api/settings', require('./src/routes/settings.routes'))

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack)
  res.status(500).json({ 
    success: false, 
    message: 'Erro interno do servidor' 
  })
})

// Serve static files from React app
const fs = require('fs')
const clientDistPath = path.join(__dirname, 'client/dist')
const indexPath = path.join(clientDistPath, 'index.html')

// Verificar se o build do React existe
if (fs.existsSync(indexPath)) {
  console.log('✅ Build do React encontrado, servindo aplicação web')
  app.use(express.static(clientDistPath))
  
  // Catch all handler para React Router (deve ser o último)
  app.get('*', (req, res) => {
    res.sendFile(indexPath)
  })
} else {
  console.log('❌ Build do React não encontrado')
  // 404 handler se não tiver build
  app.use('*', (req, res) => {
    res.status(404).json({ 
      success: false, 
      message: 'Aplicação web não disponível - build não encontrado' 
    })
  })
}

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