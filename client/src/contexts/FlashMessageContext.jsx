import React, { createContext, useContext, useState, useCallback } from 'react'
import ConfirmModal from '../components/ConfirmModal'

const FlashMessageContext = createContext()

export const useFlash = () => {
  const context = useContext(FlashMessageContext)
  if (!context) {
    throw new Error('useFlash deve ser usado dentro de um FlashMessageProvider')
  }
  return context
}

export const useFlashMessage = () => {
  const [messages, setMessages] = useState([])

  const showMessage = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const newMessage = {
      id,
      message,
      type,
      duration,
      visible: false
    }

    setMessages(prev => [...prev, newMessage])

    // Delay para trigger da animação
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === id ? { ...msg, visible: true } : msg
        )
      )
    }, 10)

    // Auto-dismiss se duration > 0
    if (duration > 0) {
      setTimeout(() => {
        removeMessage(id)
      }, duration)
    }

    return id
  }, [])

  const removeMessage = useCallback((id) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, visible: false } : msg
      )
    )

    // Delay para animação de saída
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== id))
    }, 300)
  }, [])

  const success = useCallback((message, duration) => showMessage(message, 'success', duration), [showMessage])
  const error = useCallback((message, duration) => showMessage(message, 'error', duration), [showMessage])
  const warning = useCallback((message, duration) => showMessage(message, 'warning', duration), [showMessage])
  const info = useCallback((message, duration) => showMessage(message, 'info', duration), [showMessage])

  const clearAll = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    showMessage,
    removeMessage,
    success,
    error,
    warning,
    info,
    clearAll
  }
}

export const useConfirmModal = () => {
  const [confirmData, setConfirmData] = useState(null)

  const confirm = useCallback(({
    title = "Confirmar ação",
    message = "Tem certeza que deseja continuar?",
    confirmText = "Confirmar", 
    cancelText = "Cancelar",
    type = "warning"
  }) => {
    return new Promise((resolve) => {
      setConfirmData({
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          setConfirmData(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmData(null)
          resolve(false)
        }
      })
    })
  }, [])

  const closeConfirm = useCallback(() => {
    if (confirmData) {
      confirmData.onCancel()
    }
  }, [confirmData])

  return {
    confirmData,
    confirm,
    closeConfirm
  }
}

export const FlashMessageProvider = ({ children }) => {
  const flashManager = useFlashMessage()
  const confirmManager = useConfirmModal()

  const contextValue = {
    success: flashManager.success,
    error: flashManager.error,
    warning: flashManager.warning,
    info: flashManager.info,
    clearAll: flashManager.clearAll,
    confirm: confirmManager.confirm
  }

  return (
    <FlashMessageContext.Provider value={contextValue}>
      {children}
      <FlashMessageContainer 
        messages={flashManager.messages} 
        onRemove={flashManager.removeMessage} 
      />
      {confirmManager.confirmData && (
        <ConfirmModal
          isOpen={true}
          onClose={confirmManager.closeConfirm}
          onConfirm={confirmManager.confirmData.onConfirm}
          title={confirmManager.confirmData.title}
          message={confirmManager.confirmData.message}
          confirmText={confirmManager.confirmData.confirmText}
          cancelText={confirmManager.confirmData.cancelText}
          type={confirmManager.confirmData.type}
        />
      )}
    </FlashMessageContext.Provider>
  )
}

// Componente Container dos Flash Messages
const FlashMessageContainer = ({ messages, onRemove }) => {
  if (messages.length === 0) return null

  return (
    <div className="flash-message-container">
      {messages.map((message) => (
        <FlashMessageItem
          key={message.id}
          message={message}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

// Componente Individual de Flash Message
const FlashMessageItem = ({ message, onRemove }) => {
  const { CheckCircle, AlertCircle, AlertTriangle, Info, X } = require('lucide-react')

  const getIcon = () => {
    switch (message.type) {
      case 'success': return <CheckCircle size={20} />
      case 'error': return <AlertCircle size={20} />
      case 'warning': return <AlertTriangle size={20} />
      case 'info': return <Info size={20} />
      default: return <Info size={20} />
    }
  }

  const handleClick = () => {
    onRemove(message.id)
  }

  return (
    <div 
      className={`flash-message flash-message-${message.type} ${message.visible ? 'flash-message-visible' : ''}`}
      onClick={handleClick}
    >
      <div className="flash-message-content">
        <div className="flash-message-icon">
          {getIcon()}
        </div>
        <div className="flash-message-text">
          {message.message}
        </div>
        <button 
          className="btn-main btn-sm flash-message-close"
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
          aria-label="Fechar mensagem"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}