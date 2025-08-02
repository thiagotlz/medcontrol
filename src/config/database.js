const mysql = require('mysql2/promise')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medcontrol',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
}

// Criar pool de conexões
const pool = mysql.createPool(dbConfig)

// Função para testar conexão
const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Conexão com MySQL estabelecida')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error.message)
    return false
  }
}

// Função para executar queries
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params)
    return rows
  } catch (error) {
    console.error('❌ Erro na query:', error.message)
    throw error
  }
}

// Função para executar transações
const transaction = async (callback) => {
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

// Inicializar banco de dados
const initializeDatabase = async () => {
  try {
    // Criar banco se não existir
    const connectionWithoutDB = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    })
    
    await connectionWithoutDB.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``)
    await connectionWithoutDB.end()
    
    console.log(`✅ Banco de dados '${dbConfig.database}' verificado/criado`)
    
    // Testar conexão com o banco
    const isConnected = await testConnection()
    
    if (isConnected) {
      // Executar migrations
      await runMigrations()
    }
    
    return isConnected
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error.message)
    return false
  }
}

// Executar migrations
const runMigrations = async () => {
  try {
    console.log('🔄 Executando migrations...')
    
    // Tabela de usuários
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)
    
    // Tabela de medicamentos
    await query(`
      CREATE TABLE IF NOT EXISTS medications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        dosage VARCHAR(100),
        frequency_hours INT NOT NULL,
        start_time TIME NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    
    // Tabela de agendamentos (próximas doses)
    await query(`
      CREATE TABLE IF NOT EXISTS medication_schedules (
        id INT PRIMARY KEY AUTO_INCREMENT,
        medication_id INT NOT NULL,
        scheduled_time DATETIME NOT NULL,
        status ENUM('pending', 'sent', 'taken', 'missed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
        INDEX idx_scheduled_time (scheduled_time),
        INDEX idx_status (status)
      )
    `)
    
    // Tabela de logs de notificações
    await query(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        medication_id INT NOT NULL,
        schedule_id INT NOT NULL,
        type ENUM('email', 'pushover') NOT NULL,
        status ENUM('sent', 'failed') NOT NULL,
        message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES medication_schedules(id) ON DELETE CASCADE
      )
    `)
    
    // Tabela de configurações do usuário
    await query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        pushover_email VARCHAR(255),
        smtp_host VARCHAR(255),
        smtp_port INT DEFAULT 587,
        smtp_secure BOOLEAN DEFAULT false,
        smtp_user VARCHAR(255),
        smtp_password VARCHAR(255),
        notifications_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_settings (user_id)
      )
    `)
    
    console.log('✅ Migrations executadas com sucesso')
  } catch (error) {
    console.error('❌ Erro nas migrations:', error.message)
    throw error
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  initializeDatabase
}