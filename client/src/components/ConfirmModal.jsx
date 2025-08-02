import React from 'react'
import { X, AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar ação",
  message = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning" // warning, danger, info
}) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertTriangle size={24} className="text-error" />
      case 'warning': return <AlertTriangle size={24} className="text-warning" />
      default: return <AlertTriangle size={24} className="text-warning" />
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-modal">
        <div className="modal-header">
          <div className="modal-title">
            {getIcon()}
            <span>{title}</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-main"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn-action ${type === 'danger' ? 'btn-error' : ''}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}