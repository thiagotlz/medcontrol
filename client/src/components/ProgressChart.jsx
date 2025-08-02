import React from 'react'
import { Calendar, Clock, CheckCircle, Timer } from 'lucide-react'

export default function ProgressChart({ medication }) {
  const { progress } = medication

  if (!progress) return null

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#10b981' // green
    if (percentage >= 75) return '#3b82f6' // blue
    if (percentage >= 50) return '#f59e0b' // yellow
    if (percentage >= 25) return '#f97316' // orange
    return '#ef4444' // red
  }

  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress.progressPercentage / 100) * circumference

  return (
    <div className="progress-chart">
      <div className="chart-header">
        <h3 className="chart-title">{medication.name}</h3>
        <div className="chart-status">
          {progress.isCompleted ? (
            <span className="status-completed">
              <CheckCircle size={16} />
              Concluído
            </span>
          ) : (
            <span className="status-active">
              <Timer size={16} />
              Em andamento
            </span>
          )}
        </div>
      </div>

      <div className="chart-body">
        {/* Círculo de progresso */}
        <div className="chart-circle">
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Círculo de fundo */}
            <circle
              cx="60"
              cy="60"
              r="45"
              stroke="var(--border-color)"
              strokeWidth="8"
              fill="none"
            />
            
            {/* Círculo de progresso */}
            <circle
              cx="60"
              cy="60"
              r="45"
              stroke={getProgressColor(progress.progressPercentage)}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              className="progress-circle"
            />
          </svg>
          
          {/* Texto central */}
          <div className="chart-center">
            <div className="progress-percentage">
              {progress.progressPercentage}%
            </div>
            <div className="progress-day">
              Dia {progress.daysPassed + 1}
            </div>
          </div>
        </div>

        {/* Informações detalhadas */}
        <div className="chart-details">
          <div className="detail-row">
            <Calendar size={16} />
            <span className="detail-label">Duração total:</span>
            <span className="detail-value">{progress.totalDays} dias</span>
          </div>
          
          <div className="detail-row">
            <Timer size={16} />
            <span className="detail-label">Dias restantes:</span>
            <span className="detail-value">{progress.daysRemaining} dias</span>
          </div>
          
          <div className="detail-row">
            <Clock size={16} />
            <span className="detail-label">Início:</span>
            <span className="detail-value">
              {new Date(progress.startDate).toLocaleDateString('pt-BR')}
            </span>
          </div>
          
          <div className="detail-row">
            <CheckCircle size={16} />
            <span className="detail-label">Término:</span>
            <span className="detail-value">
              {new Date(progress.endDate).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de progresso linear alternativa */}
      <div className="chart-footer">
        <div className="linear-progress">
          <div 
            className="linear-progress-fill"
            style={{ 
              width: `${progress.progressPercentage}%`,
              backgroundColor: getProgressColor(progress.progressPercentage)
            }}
          />
        </div>
        <div className="progress-labels">
          <span className="start-label">Início</span>
          <span className="current-label">
            {progress.daysPassed + 1}/{progress.totalDays}
          </span>
          <span className="end-label">Fim</span>
        </div>
      </div>
    </div>
  )
}