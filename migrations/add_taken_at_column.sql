-- Adicionar coluna taken_at à tabela medication_schedules se não existir
ALTER TABLE medication_schedules 
ADD COLUMN IF NOT EXISTS taken_at DATETIME NULL AFTER status;

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_taken_at ON medication_schedules(taken_at);

-- Atualizar registros existentes com status 'taken' para ter taken_at
UPDATE medication_schedules 
SET taken_at = scheduled_time 
WHERE status = 'taken' AND taken_at IS NULL;