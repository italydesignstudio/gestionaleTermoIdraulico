#!/bin/bash

echo "🚀 Script di Deployment Gestionale Termoidraulico"
echo "================================================="

# Funzione per controllare se un comando esiste
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Controlla prerequisiti
echo "🔍 Controllo prerequisiti..."

if ! command_exists npm; then
    echo "❌ npm non trovato. Installa Node.js"
    exit 1
fi

if ! command_exists git; then
    echo "❌ git non trovato. Installa Git"
    exit 1
fi

echo "✅ Prerequisiti soddisfatti"

# Installa dipendenze
echo "📦 Installazione dipendenze..."

echo "  Backend..."
cd server && npm install
if [ $? -ne 0 ]; then
    echo "❌ Errore installazione dipendenze backend"
    exit 1
fi

echo "  Frontend..."
cd ../client && npm install
if [ $? -ne 0 ]; then
    echo "❌ Errore installazione dipendenze frontend"
    exit 1
fi

cd ..

echo "✅ Dipendenze installate"

# Build frontend
echo "🏗️  Build frontend..."
cd client && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Errore build frontend"
    exit 1
fi

cd ..

echo "✅ Build completato"

# Crea file per deployment
echo "📝 Creazione file deployment..."

# Railway config
cat > server/railway.toml << 'EOF'
[build]
  builder = "NIXPACKS"

[deploy]
  startCommand = "npm start"
  healthcheckPath = "/health"
  healthcheckTimeout = 300
  restartPolicyType = "ON_FAILURE"
  restartPolicyMaxRetries = 10

[variables]
  NODE_ENV = "production"
EOF

# Vercel config
cat > client/vercel.json << 'EOF'
{
  "version": 2,
  "name": "gestionale-termoidraulico",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "@vite_api_base_url"
  }
}
EOF

echo "✅ File deployment creati"

# Istruzioni finali
echo ""
echo "🎉 Preparazione completata!"
echo ""
echo "📋 Prossimi passi per il deployment:"
echo ""
echo "1️⃣  BACKEND (Railway):"
echo "   • Vai su https://railway.app"
echo "   • Crea nuovo progetto da GitHub"
echo "   • Seleziona la cartella 'server'"
echo "   • Aggiungi PostgreSQL addon"
echo "   • Configura variabili d'ambiente:"
echo "     - NODE_ENV=production"
echo "     - JWT_SECRET=<genera-chiave-forte>"
echo "     - ENCRYPTION_KEY=<genera-chiave-32-caratteri>"
echo ""
echo "2️⃣  FRONTEND (Vercel):"
echo "   • Vai su https://vercel.com"
echo "   • Importa progetto da GitHub"
echo "   • Root Directory: client"
echo "   • Configura variabile d'ambiente:"
echo "     - VITE_API_BASE_URL=<url-backend-railway>/api"
echo ""
echo "3️⃣  CONFIGURAZIONE FINALE:"
echo "   • Aggiorna CORS_ORIGINS su Railway con URL Vercel"
echo "   • Esegui script init-admin sul backend"
echo "   • Testa il deployment"
echo ""
echo "🔗 Link utili:"
echo "   • Railway: https://railway.app"
echo "   • Vercel: https://vercel.com"
echo "   • Documentazione: ./DEPLOYMENT.md"
echo ""
echo "💡 Tip: Tutte le configurazioni sono già pronte!"
echo "    Segui semplicemente i passaggi sopra."
