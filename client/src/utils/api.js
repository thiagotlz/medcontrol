import { getAuthHeaders, removeAuth } from './auth'

const API_BASE_URL = '/api'

// Função auxiliar para fazer requisições
const makeRequest = async (url, options = {}) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    // Adicionar headers de autenticação se necessário
    if (options.authenticated !== false) {
      config.headers = {
        ...config.headers,
        ...getAuthHeaders()
      }
    }

    const response = await fetch(`${API_BASE_URL}${url}`, config)
    const result = await response.json()

    // Se token expirou, redirecionar para login
    if (response.status === 401 && result.expired) {
      removeAuth()
      window.location.href = '/login'
      return { success: false, message: 'Sessão expirada' }
    }

    return {
      success: response.ok,
      status: response.status,
      data: result.data,
      message: result.message,
      ...result
    }

  } catch (error) {
    console.error('[API] Erro na requisição:', error)
    return {
      success: false,
      message: 'Erro de conexão com o servidor'
    }
  }
}

// ===== AUTH API =====
export const authAPI = {
  // Login
  login: async (email, password) => {
    return makeRequest('/auth/login', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({ email, password })
    })
  },

  // Registro
  register: async (name, email, password) => {
    return makeRequest('/auth/register', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({ name, email, password })
    })
  },

  // Verificar token
  verify: async () => {
    return makeRequest('/auth/verify', {
      method: 'GET'
    })
  },

  // Atualizar perfil
  updateProfile: async (data) => {
    return makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // Renovar token
  refresh: async () => {
    return makeRequest('/auth/refresh', {
      method: 'POST'
    })
  }
}

// ===== MEDICATIONS API =====
export const medicationsAPI = {
  // Listar medicamentos
  list: async (activeOnly = true) => {
    return makeRequest(`/medications?active=${activeOnly}`, {
      method: 'GET'
    })
  },

  // Obter medicamento específico
  get: async (id) => {
    return makeRequest(`/medications/${id}`, {
      method: 'GET'
    })
  },

  // Criar medicamento
  create: async (data) => {
    return makeRequest('/medications', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Atualizar medicamento
  update: async (id, data) => {
    return makeRequest(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // Deletar medicamento
  delete: async (id) => {
    return makeRequest(`/medications/${id}`, {
      method: 'DELETE'
    })
  },

  // Ativar/Desativar medicamento
  toggle: async (id) => {
    return makeRequest(`/medications/${id}/toggle`, {
      method: 'PATCH'
    })
  },

  // Obter agendamentos de um medicamento
  getSchedules: async (id, limit = 10) => {
    return makeRequest(`/medications/${id}/schedules?limit=${limit}`, {
      method: 'GET'
    })
  },

  // Obter estatísticas do usuário
  getStats: async (days = 30) => {
    return makeRequest(`/medications/stats?days=${days}`, {
      method: 'GET'
    })
  }
}

// ===== SETTINGS API =====
export const settingsAPI = {
  // Obter configurações
  get: async () => {
    return makeRequest('/settings', {
      method: 'GET'
    })
  },

  // Atualizar configurações
  update: async (data) => {
    return makeRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // Verificar status das configurações
  getStatus: async () => {
    return makeRequest('/settings/status', {
      method: 'GET'
    })
  },

  // Testar configurações SMTP
  testSMTP: async () => {
    return makeRequest('/settings/test-smtp', {
      method: 'POST'
    })
  }
}

// Função para upload de arquivos (se necessário no futuro)
export const uploadFile = async (file, endpoint) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        // Não definir Content-Type, deixar o browser definir para FormData
      },
      body: formData
    })

    const result = await response.json()

    return {
      success: response.ok,
      status: response.status,
      data: result.data,
      message: result.message,
      ...result
    }

  } catch (error) {
    console.error('[API] Erro no upload:', error)
    return {
      success: false,
      message: 'Erro no upload do arquivo'
    }
  }
}