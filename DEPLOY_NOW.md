# 🚀 DEPLOYMENT IMMEDIATO - Gestionale Termoidraulico

## ✅ Stato Preparazione
- ✅ Backend migrato a PostgreSQL
- ✅ Frontend compilato senza errori 
- ✅ File di configurazione creati
- ✅ Pronto per deployment!

## 🎯 DEPLOYMENT RAPIDO

### 1. BACKEND (Railway.app) - 5 minuti

1. **Vai su [Railway.app](https://railway.app)**
2. **Login con GitHub**
3. **New Project → Deploy from GitHub repo**
4. **Seleziona questo repository**
5. **Configura il servizio:**
   - Root Directory: `server`
   - Railway rileverà automaticamente l'app Node.js

6. **Aggiungi PostgreSQL:**
   - Nel dashboard clicca "New Service"
   - Seleziona "PostgreSQL"
   - Railway fornirà automaticamente DATABASE_URL

7. **Configura variabili d'ambiente:**
   ```
   NODE_ENV=production
   JWT_SECRET=tuo_super_secret_jwt_key_cambial_per_produzione_2024
   ENCRYPTION_KEY=tuo_32_char_encryption_key_123456
   PORT=3000
   ```

8. **Deploy automatico** 
   - URL Backend: `https://gestionale-termoidraulico-api.railway.app`

### 2. FRONTEND (Vercel) - 3 minuti

1. **Vai su [Vercel.com](https://vercel.com)**
2. **Login con GitHub**
3. **New Project → Import da GitHub**
4. **Configura:**
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
