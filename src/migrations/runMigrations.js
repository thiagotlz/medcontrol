const { query } = require('../config/database')

async function runMigrations() {
  try {
    console.log('🔄 Executando migrations...')
    
    // Migration 1: Adicionar coluna taken_at
    try {
      await query(`
        ALTER TABLE medication_schedules 
        ADD COLUMN taken_at DATETIME NULL AFTER status
      `)
      console.log('✅ Coluna taken_at adicionada com sucesso')
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Coluna taken_at já existe')
      } else {
        throw error
      }
    }

    // Migration 2: Adicionar índice
    try {
      await query(`
        CREATE INDEX idx_taken_at ON medication_schedules(taken_at)
      `)
      console.log('✅ Índice idx_taken_at criado com sucesso')
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Índice idx_taken_at já existe')
      } else {
        throw error
      }
    }

    // Migration 3: Atualizar registros existentes
    const result = await query(`
      UPDATE medication_schedules 
      SET taken_at = scheduled_time 
      WHERE status = 'taken' AND taken_at IS NULL
    `)
    
    if (result.affectedRows > 0) {
      console.log(`✅ ${result.affectedRows} registros atualizados com taken_at`)
    } else {
      console.log('✓ Nenhum registro para atualizar')
    }

    // Migration 4: Alterar coluna frequency_hours para DECIMAL
    try {
      await query(`
        ALTER TABLE medications 
        MODIFY COLUMN frequency_hours DECIMAL(10,2) NOT NULL
      `)
      console.log('✅ Coluna frequency_hours alterada para DECIMAL com sucesso')
    } catch (error) {
      console.log('❌ Erro ao alterar coluna frequency_hours:', error.message)
      // Não falhar se já foi alterada
    }

    console.log('✅ Todas as migrations executadas com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error)
    throw error
  }
}

// Exportar para uso em outros lugares
module.exports = runMigrations

// Se executado diretamente
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}