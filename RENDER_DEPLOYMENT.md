# 🚀 DEPLOYMENT SU RENDER.COM

## ⚡ Deployment Super-Rapido (15 minuti totali)

### 📋 **Prerequisiti**
- Account GitHub con il repository push-ato
- Account gratuito su [Render.com](https://render.com)

### 🔗 **Step 1: Collegamento GitHub**
1. **Vai su [Render.com](https://render.com)**
2. **Login con GitHub**
3. **Autorizza Render** ad accedere ai tuoi repository

---

## 💾 **Step 2: Database PostgreSQL (3 minuti)**

1. **Dashboard Render → New +**
2. **Seleziona "PostgreSQL"**
3. **Configurazione:**
   ```
   Name: gestionale-termoidraulico-db
   Database: gestionale
   User: gestionale_user
   Region: Frankfurt (EU) [più vicino all'Italia]
   Plan: Free
   ```
4. **Create Database**
5. **⚠️ IMPORTANTE: Copia il DATABASE_URL** (lo userai nel backend)

---

## 🌐 **Step 3: Backend API (5 minuti)**

1. **Dashboard Render → New + → Web Service**
2. **Connect Repository:** 
   - Seleziona: `italydesignstudio/gestionaleTermoIdraulico`
3. **Configurazione:**
   ```
   Name: gestionale-termoidraulico-api
   Root Directory: server
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

4. **Environment Variables:**
   ```bash
   NODE_ENV=production
   DATABASE_URL=<copia-dal-database-creato-sopra>
   JWT_SECRET=gestionale-2025-super-secret-jwt-key-32-chars
   CORS_ORIGINS=*
   ```

5. **Deploy** (ci vogliono 3-4 minuti)
6. **⚠️ IMPORTANTE: Copia l'URL** (es: `https://gestionale-termoidraulico-api.onrender.com`)

---

## 🖥️ **Step 4: Frontend React (4 minuti)**

1. **Dashboard Render → New + → Static Site**
2. **Connect Repository:**
   - Seleziona: `italydesignstudio/gestionaleTermoIdraulico`
3. **Configurazione:**
   ```
   Name: gestionale-termoidraulico-frontend
   Root Directory: client
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Environment Variables:**
   ```bash
   VITE_API_BASE_URL=<url-backend-da-step-3>/api
   ```
   Esempio: `https://gestionale-termoidraulico-api.onrender.com/api`

5. **Deploy** (ci vogliono 2-3 minuti)
6. **⚠️ IMPORTANTE: Copia l'URL frontend** (es: `https://gestionale-termoidraulico-frontend.onrender.com`)

---

## 🔧 **Step 5: Configurazione Finale (3 minuti)**

### 5.1 Aggiorna CORS
1. **Vai al Backend service su Render**
2. **Environment → Edit CORS_ORIGINS:**
   ```
   CORS_ORIGINS=https://gestionale-termoidraulico-frontend.onrender.com
   ```
3. **Save** (triggera redeploy automatico)

### 5.2 Inizializza Database
1. **Backend service → Shell/Console**
2. **Esegui:**
   ```bash
   node scripts/init-admin.js
   ```

---

## ✅ **TESTING**

### Test Backend
- Visita: `https://gestionale-termoidraulico-api.onrender.com/api/health`
- Dovresti vedere: `{"status":"OK",...}`

### Test Frontend
- Visita: `https://gestionale-termoidraulico-frontend.onrender.com`
- Login con: `admin` / `admin123`

---

## 🎯 **URL FINALI**

```bash
🌐 Frontend: https://gestionale-termoidraulico-frontend.onrender.com
🔗 Backend:  https://gestionale-termoidraulico-api.onrender.com
📊 API Health: https://gestionale-termoidraulico-api.onrender.com/api/health
💾 Database: Gestito automaticamente da Render
```

---

## 🔥 **Vantaggi di Render vs Railway/Vercel:**

✅ **Tutto in una piattaforma**
✅ **Setup più semplice** 
✅ **PostgreSQL gratuito incluso**
✅ **SSL automatico**
✅ **Zero configurazione Docker**
✅ **Deploy automatico da GitHub**
✅ **Logs integrati**
✅ **Shell/Console integrata**

---

## 🐛 **Troubleshooting**

### Problema: Build fallisce
**Soluzione:** Controlla i logs di build nel dashboard Render

### Problema: Database connection error
**Soluzione:** Verifica che DATABASE_URL sia copiato correttamente

### Problema: CORS errors
**Soluzione:** Aggiorna CORS_ORIGINS con l'URL frontend corretto

### Problema: Frontend non si connette al backend
**Soluzione:** Verifica VITE_API_BASE_URL nel frontend

---

## 🔄 **Deploy Automatico**

Render fa auto-deploy su ogni push a `main`:
```bash
git add .
git commit -m "Update gestionale"
git push origin main
# Render redeploys automaticamente!
```

---

## 🎉 **CREDENZIALI DEFAULT**

```
Username: admin
Password: admin123
```

**⚠️ CAMBIA LA PASSWORD APPENA ENTRI!**
