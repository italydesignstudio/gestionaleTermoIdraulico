# 🚀 DEPLOYMENT IMMEDIATO - Gestionale Termoidraulico

## ✅ Stato Preparazione
- ✅ Backend migrato a PostgreSQL
- ✅ Frontend compilato senza errori 
- ✅ File di configurazione aggiornati
- ✅ Health check endpoints configurati
- ✅ CORS configurato per produzione
- ✅ Pronto per deployment!

## 🎯 DEPLOYMENT RAPIDO (15 minuti totali)

### 1. BACKEND (Railway.app) - 7 minuti

#### Step 1: Create Project
1. **Vai su [Railway.app](https://railway.app)**
2. **Login con GitHub** 
3. **New Project → Deploy from GitHub repo**
4. **Seleziona: `italydesignstudio/gestionaleTermoIdraulico`**
5. **ROOT DIRECTORY: `server`** ⚠️ IMPORTANTE!

#### Step 2: Add Database
6. **Click "Add Service" → PostgreSQL**
7. **Aspetta il provisioning del database** (2-3 min)

#### Step 3: Set Variables
8. **Variables tab → Add:**
   ```
   NODE_ENV=production
   JWT_SECRET=gestionale-2025-super-secret-jwt-key-32-chars
   CORS_ORIGINS=*
   ```

#### Step 4: Deploy
9. **Settings → Redeploy** 
10. **Aspetta il deploy** (2-3 min)
11. **Copia l'URL Railway** (es: https://web-production-abc123.up.railway.app)

### 2. FRONTEND (Vercel) - 8 minuti

#### Step 1: Create Project  
1. **Vai su [Vercel.com](https://vercel.com)**
2. **Login con GitHub**
3. **New Project → Import GitHub repo**
4. **Seleziona: `italydesignstudio/gestionaleTermoIdraulico`**

#### Step 2: Configure Build
5. **ROOT DIRECTORY: `client`** ⚠️ IMPORTANTE!
6. **Framework Preset: Vite**
7. **Build Command: `npm run build`**
8. **Output Directory: `dist`**

#### Step 3: Set Environment Variables
9. **Environment Variables → Add:**
   ```
   VITE_API_BASE_URL = https://your-railway-url-from-step1/api
   ```
   (Usa l'URL copiato dal punto 11 sopra + `/api`)

#### Step 4: Deploy
10. **Click Deploy** (3-4 min)
11. **Copia l'URL Vercel** (es: https://gestionale-abc123.vercel.app)

### 3. FINAL SETUP - 2 minuti

#### Update CORS
1. **Torna su Railway → Variables**
2. **Modifica CORS_ORIGINS:**
   ```
   CORS_ORIGINS=https://your-vercel-url-from-step11
   ```
3. **Redeploy Railway**

#### Initialize Database
4. **Railway → Console** e esegui:
   ```bash
   node scripts/init-admin.js
   ```

## ✅ TEST FINALE

### Backend Test
- Visita: `https://your-railway-url/api/health`
- Dovresti vedere: `{"status":"OK",...}`

### Frontend Test  
- Visita: `https://your-vercel-url`
- Login con: `admin` / `admin123`

## 🎯 CREDENZIALI DEFAULT
```
Username: admin
Password: admin123
```

**⚠️ CAMBIA LA PASSWORD APPENA ENTRI!**

---

## 🔥 DEPLOYMENT IN 1 COMANDO (CLI)

Se preferisci usare la CLI:

```bash
# 1. Deploy Backend (Railway)
cd server
npx @railway/cli login
npx @railway/cli up

# 2. Deploy Frontend (Vercel)  
cd ../client
npx vercel --prod
```
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Variabile d'ambiente:**
   ```
   VITE_API_BASE_URL=https://tuo-backend.railway.app/api
   ```

6. **Deploy automatico**
   - URL Frontend: `https://gestionale-termoidraulico.vercel.app`

### 3. CONFIGURAZIONE FINALE (2 minuti)

1. **Aggiorna CORS su Railway:**
   ```
   CORS_ORIGINS=https://gestionale-termoidraulico.vercel.app
   ```

2. **Inizializza admin user sul backend:**
   - Sul dashboard Railway, vai in "Deployments"
   - Apri la console e esegui: `npm run init-admin`

3. **Credenziali admin iniziali:**
   - Email: `admin@termoidraulico.com`
   - Password: `Admin123!`
   - ⚠️ **CAMBIARE AL PRIMO ACCESSO!**

## 🎉 FATTO!

Il gestionale è ora online e accessibile a:
- **Frontend**: https://gestionale-termoidraulico.vercel.app
- **Backend API**: https://gestionale-termoidraulico-api.railway.app

## 🔒 Sicurezza Post-Deployment

1. **Cambia password admin** al primo accesso
2. **Genera JWT_SECRET forte** (almeno 32 caratteri)
3. **Monitora logs** su Railway dashboard
4. **Backup database** settimanale (Railway fa backup automatici)

## 💡 Alternative se Railway/Vercel non funzionano

### Backend:
- **Render.com** (500 ore gratuite/mese)
- **Heroku** (con addon PostgreSQL)

### Frontend:
- **Netlify** (100GB/mese gratuito)
- **GitHub Pages**

## 🆘 Risoluzione Problemi

- **Backend non si avvia**: Controlla variabili d'ambiente
- **Frontend non si connette**: Verifica VITE_API_BASE_URL
- **Errori CORS**: Aggiungi URL frontend a CORS_ORIGINS
- **Database connection**: Verifica che PostgreSQL addon sia attivo

## 📞 Support

Per problemi tecnici, controlla:
1. Railway logs (backend)
2. Vercel function logs (frontend)
3. Browser console per errori JavaScript

---

🎯 **Obiettivo raggiunto**: Gestionale termoidraulico robusto con PostgreSQL, deployato gratuitamente e accessibile da internet!
