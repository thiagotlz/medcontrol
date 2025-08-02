# 💊 MedControl

Sistema completo de gerenciamento de medicação com notificações automáticas via Pushover.

## ✨ Funcionalidades

- 🔐 **Sistema de autenticação** completo (registro/login)
- 💊 **Gerenciamento de medicamentos** (CRUD completo)
- ⏰ **Agendamento automático** de doses
- 📧 **Notificações por email** integradas com Pushover
- 📊 **Dashboard** com estatísticas de adesão
- ⚙️ **Configurações personalizáveis** de SMTP
- 📱 **Interface responsiva** para mobile
- 🎨 **Design moderno** similar ao copyfy

## 🚀 Deploy no Easypanel

### 1. Configurar MySQL
No Easypanel, crie um serviço MySQL primeiro:
- Nome: `medcontrol-mysql`
- Imagem: `mysql:8.0`
- Variáveis de ambiente:
  ```
  MYSQL_ROOT_PASSWORD=sua-senha-forte
  MYSQL_DATABASE=medcontrol
  ```

### 2. Deploy da Aplicação
1. No Easypanel, crie um novo serviço
2. **Fonte**: GitHub Repository
3. **Repository**: `https://github.com/thiagotlz/medcontrol.git`
4. **Build Type**: **Docker** (não Nixpacks)
5. **Port**: `3000`

### 3. Variáveis de Ambiente
Configure estas variáveis no Easypanel:

```bash
# Database
DB_HOST=medcontrol-mysql
DB_PORT=3306
DB_NAME=medcontrol
DB_USER=root
DB_PASSWORD=sua-senha-forte

# JWT
JWT_SECRET=seu-jwt-secret-super-seguro

# Email/SMTP (opcional - pode configurar via interface)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# Pushover (opcional - pode configurar via interface)
PUSHOVER_EMAIL_TO=seu-email-pushover@example.com
```

### 4. Configuração de Domínio
- Configure seu domínio customizado no Easypanel
- O sistema será acessível via HTTPS automaticamente

## 🖥️ Desenvolvimento Local

### Requisitos
- Node.js 18+
- MySQL 8.0
- NPM ou Yarn

### Instalação
```bash
# Clone o repositório
git clone https://github.com/thiagotlz/medcontrol.git
cd medcontrol

# Instalar dependências do backend
npm install

# Instalar dependências do frontend
cd client
npm install
cd ..

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### Executar
```bash
# Backend (porta 3000)
npm run dev

# Frontend (porta 5173) - em outro terminal
cd client
npm run dev
```

## 📱 Como Usar

### 1. Primeira Configuração
1. Acesse o sistema e crie sua conta
2. Vá em **Configurações**
3. Configure seu **email do Pushover**
4. Configure seu **servidor SMTP**
5. Teste as configurações

### 2. Cadastrar Medicamentos
1. Acesse **Medicamentos**
2. Clique em **Novo Medicamento**
3. Preencha:
   - Nome do medicamento
   - Dosagem (opcional)
   - Frequência em horas
   - Horário da primeira dose
   - Observações (opcional)

### 3. Receber Notificações
- O sistema enviará emails automaticamente nos horários configurados
- Os emails chegam no seu app Pushover como notificação push
- Acesse o Dashboard para ver estatísticas de adesão

## 🏗️ Arquitetura

### Backend
- **Node.js + Express** - API RESTful
- **MySQL** - Banco de dados
- **JWT** - Autenticação
- **Nodemailer** - Envio de emails
- **node-cron** - Agendamento de tarefas

### Frontend
- **React + Vite** - Interface moderna
- **React Router** - Navegação SPA
- **Lucide Icons** - Ícones consistentes
- **CSS Modules** - Estilização

### Segurança
- Senhas hasheadas com bcrypt
- Rate limiting
- Helmet para headers seguros
- CORS configurado
- Validação de dados

## 📧 Integração Pushover

O sistema funciona enviando emails para seu **email do Pushover**, que são convertidos automaticamente em notificações push no seu dispositivo.

### Como configurar Pushover:
1. Instale o app Pushover no seu celular
2. Crie uma conta no pushover.net
3. Configure email forwarding para seu email Pushover
4. No MedControl, use esse email nas configurações

## 🛠️ Personalização

O sistema é totalmente personalizável:
- **Temas**: Claro e escuro
- **Frequências**: De 1 hora a 1 semana
- **SMTP**: Qualquer provedor (Gmail, Outlook, etc.)
- **Layout**: Responsivo para todos os dispositivos

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

**MedControl** - Sua saúde, nossa prioridade! 💊✨