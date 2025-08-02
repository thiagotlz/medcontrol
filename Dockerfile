# Usar imagem oficial do Node.js
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json do backend
COPY package*.json ./

# Instalar dependências do backend
RUN npm ci --omit=dev

# Copiar package.json do frontend
COPY client/package*.json ./client/

# Instalar dependências do frontend
RUN cd client && npm ci

# Copiar código fonte
COPY . .

# Build do frontend
RUN cd client && npm run build

# Criar diretório para uploads
RUN mkdir -p public/uploads

# Expor porta
EXPOSE 3000

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]