# Usa l'immagine Node.js ufficiale
FROM node:18-alpine

# Crea directory di lavoro
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm ci --only=production

# Copia il codice sorgente
COPY . .

# Espone la porta
EXPOSE 3000

# Crea un utente non-root per sicurezza
RUN addgroup -g 1001 -S nodejs
RUN adduser -S node -u 1001

# Cambia ownership dei file
RUN chown -R node:nodejs /app
USER node

# Comando di avvio
CMD ["npm", "start"]
