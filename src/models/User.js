const { query } = require('../config/database')
const bcrypt = require('bcryptjs')

class User {
  constructor(data) {
    this.id = data.id
    this.email = data.email
    this.password = data.password
    this.name = data.name
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  // Criar usuário
  static async create({ email, password, name }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 12)
      
      const result = await query(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, name]
      )
      
      return await User.findById(result.insertId)
    } catch (error) {
      throw error
    }
  }

  // Buscar por ID
  static async findById(id) {
    try {
      const users = await query('SELECT * FROM users WHERE id = ?', [id])
      return users.length > 0 ? new User(users[0]) : null
    } catch (error) {
      throw error
    }
  }

  // Buscar por email
  static async findByEmail(email) {
    try {
      const users = await query('SELECT * FROM users WHERE email = ?', [email])
      return users.length > 0 ? new User(users[0]) : null
    } catch (error) {
      throw error
    }
  }

  // Verificar senha
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password)
  }

  // Atualizar usuário
  async update(data) {
    try {
      const fields = []
      const values = []
      
      if (data.name) {
        fields.push('name = ?')
        values.push(data.name)
      }
      
      if (data.email) {
        fields.push('email = ?')
        values.push(data.email)
      }
      
      if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 12)
        fields.push('password = ?')
        values.push(hashedPassword)
      }
      
      if (fields.length === 0) {
        return this
      }
      
      values.push(this.id)
      
      await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      )
      
      return await User.findById(this.id)
    } catch (error) {
      throw error
    }
  }

  // Deletar usuário
  async delete() {
    try {
      await query('DELETE FROM users WHERE id = ?', [this.id])
      return true
    } catch (error) {
      throw error
    }
  }

  // Listar todos os usuários (admin)
  static async findAll() {
    try {
      const users = await query('SELECT * FROM users ORDER BY created_at DESC')
      return users.map(user => new User(user))
    } catch (error) {
      throw error
    }
  }

  // Serializar para JSON (remover senha)
  toJSON() {
    const { password, ...userWithoutPassword } = this
    return userWithoutPassword
  }
}

module.exports = User