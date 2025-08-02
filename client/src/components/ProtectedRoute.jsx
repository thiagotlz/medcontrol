import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated, checkTokenValidity } from '../utils/auth'

function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isValidAuth, setIsValidAuth] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const validateAuth = async () => {
      if (!isAuthenticated()) {
        setIsValidAuth(false)
        setIsLoading(false)
        return
      }

      const tokenCheck = await checkTokenValidity()
      setIsValidAuth(tokenCheck.valid)
      setIsLoading(false)
    }

    validateAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-secondary">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!isValidAuth) {
    return <Navigate to="/login" state={{ from: location, expired: true }} replace />
  }

  return children
}

export default ProtectedRoute