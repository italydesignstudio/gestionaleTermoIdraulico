# 🚀 Deployment Gestionale Termoidraulico

## Guida al Deployment

### 1. Backend (Railway.app)

#### Prerequisiti
- Account gratuito su [Railway.app](https://railway.app)
- Repository GitHub con il codice

#### Passaggi:
1. **Fai login su Railway**
   - Vai su railway.app e accedi con GitHub

2. **Crea nuovo progetto**
   - Clicca "New Project"
   - Seleziona "Deploy from GitHub repo"
   - Scegli questo repository

3. **Configura il servizio**
   - Railway rileverà automaticamente l'app Node.js
   - Imposta la root directory su `server`

4. **Aggiungi PostgreSQL**
   - Nel dashboard, clicca "New Service"
   - Seleziona "PostgreSQL"
   - Railway fornirà automaticamente DATABASE_URL

5. **Configura variabili d'ambiente**
   ```
   NODE_ENV=production
   JWT_SECRET=your_super_secret_jwt_key_here_change_this
   ENCRYPTION_KEY=your_32_char_encryption_key_123456
   PORT=3000
   ```

6. **Deploy**
   - Railway deployerà automaticamente
   - Ottieni l'URL del backend (es: https://gestionale-termoidraulico-api.railway.app)

### 2. Frontend (Vercel)

#### Prerequisiti
- Account gratuito su [Vercel.com](https://vercel.com)

#### Passaggi:
1. **Fai login su Vercel**
   - Vai su vercel.com e accedi con GitHub

2. **Importa progetto**
   - Clicca "New Project"
   - Seleziona questo repository

3. **Configura build**
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Configura variabili d'ambiente**
   ```
   VITE_API_BASE_URL=https://tuo-backend.railway.app/api
   ```

5. **Deploy**
   - Vercel deployerà automaticamente
   - Ottieni l'URL del frontend (es: https://gestionale-termoidraulico.vercel.app)

### 3. Configurazione finale

1. **Aggiorna CORS nel backend**
   - Imposta la variabile `CORS_ORIGINS` su Railway con l'URL del frontend Vercel

2. **Test del deployment**
   - Visita l'URL del frontend
   - Effettua login/registrazione
   - Verifica funzionalità

## Alternative gratuite

### Backend:
- **Render.com** (500 ore gratuite/mese)
- **Heroku** (con addon PostgreSQL gratuito limitato)
- **Supabase** (per database + API automatica)

### Frontend:
- **Netlify** (100GB/mese gratuito)
- **GitHub Pages** (per siti statici)
- **Surge.sh** (hosting semplice)

## Monitoraggio

### Logs Backend (Railway):
```bash
railway logs --follow
```

### Metrics:
- Railway fornisce metriche built-in
- Vercel fornisce analytics e performance metrics

## Backup Database

### Backup automatico:
Railway fa backup automatici del database PostgreSQL

### Backup manuale:
```bash
# Connettiti al database
railway run psql $DATABASE_URL

# Esporta dump
pg_dump $DATABASE_URL > backup.sql
```

## Sicurezza

### Checklist produzione:
- ✅ JWT_SECRET forte e univoco
- ✅ ENCRYPTION_KEY sicura
- ✅ CORS configurato correttamente
- ✅ Rate limiting attivo
- ✅ Helmet per security headers
- ✅ Variabili sensibili in environment variables
- ✅ Database con SSL in produzione

## Costi stimati

### Completamente gratuito fino a:
- **Railway**: 500 ore/mese, 1GB RAM, 1GB storage PostgreSQL
- **Vercel**: 100GB bandwidth, build illimitati
- **Totale**: €0/mese per uso normale

### Scale-up opzionale:
- **Railway Pro**: $5/mese per rimuovere limiti
- **Vercel Pro**: $20/mese per team features
