// Chaves para localStorage
const AUTH_TOKEN_KEY = 'medcontrol_token'
const AUTH_USER_KEY = 'medcontrol_user'

// Salvar dados de autenticação
export const saveAuth = ({ token, user }) => {
  try {
    if (!token || !user) {
      console.error('[AUTH] Token ou usuário inválido')
      return false
    }

    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    
    return true
  } catch (error) {
    console.error('[AUTH] Erro ao salvar autenticação:', error)
    return false
  }
}

// Obter token
export const getToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch (error) {
    console.error('[AUTH] Erro ao obter token:', error)
    return null
  }
}

// Obter usuário
export const getUser = () => {
  try {
    const userStr = localStorage.getItem(AUTH_USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  } catch (error) {
    console.error('[AUTH] Erro ao obter usuário:', error)
    return null
  }
}

// Verificar se está autenticado
export const isAuthenticated = () => {
  const token = getToken()
  const user = getUser()
  return !!(token && user)
}

// Remover autenticação
export const removeAuth = () => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    return true
  } catch (error) {
    console.error('[AUTH] Erro ao remover autenticação:', error)
    return false
  }
}

// Atualizar dados do usuário
export const updateUser = (userData) => {
  try {
    const currentUser = getUser()
    if (!currentUser) {
      console.error('[AUTH] Usuário não encontrado')
      return false
    }

    const updatedUser = { ...currentUser, ...userData }
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser))
    
    return true
  } catch (error) {
    console.error('[AUTH] Erro ao atualizar usuário:', error)
    return false
  }
}

// Verificar se o token está expirado (básico)
export const isTokenExpired = () => {
  const token = getToken()
  if (!token) return true

  try {
    // Decode básico do JWT para verificar exp
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    
    return payload.exp < currentTime
  } catch (error) {
    console.error('[AUTH] Erro ao verificar expiração:', error)
    return true
  }
}

// Obter headers para requisições autenticadas
export const getAuthHeaders = () => {
  const token = getToken()
  if (!token) return {}

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Verificar e renovar token se necessário
export const checkTokenValidity = async () => {
  if (!isAuthenticated()) {
    return { valid: false, reason: 'not_authenticated' }
  }

  if (isTokenExpired()) {
    // Tentar renovar o token
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          saveAuth({
            token: result.data.token,
            user: result.data.user
          })
          return { valid: true, renewed: true }
        }
      }
      
      // Se não conseguiu renovar, remover auth
      removeAuth()
      return { valid: false, reason: 'token_expired' }
      
    } catch (error) {
      console.error('[AUTH] Erro ao renovar token:', error)
      removeAuth()
      return { valid: false, reason: 'network_error' }
    }
  }

  return { valid: true }
}