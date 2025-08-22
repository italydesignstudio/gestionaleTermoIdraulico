# Deployment su Render - Completo

## Backend (API) - GIÀ DEPLOYATO ✅

Il backend è già attivo su: `https://gestionale-termoidraulico-api.onrender.com`

### Database PostgreSQL ✅
- Host: dpg-ct3gj8l6l47c73coioog-a.oregon-postgres.render.com
- Database: gestionale_termoidraulico_db_rfno
- Admin utente creato: admin@gestionale.local / admin123

## Frontend - DA DEPLOYARE

### 1. Crea nuovo Static Site su Render

1. Vai su https://render.com/dashboard
2. Clicca "New" → "Static Site"
3. Collega il tuo repository GitHub
4. Configura:
   - **Name**: `gestionale-termoidraulico-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 2. Environment Variables per Frontend

Aggiungi questa variabile d'ambiente:
```
VITE_API_BASE_URL=https://gestionale-termoidraulico-api.onrender.com/api
```

### 3. Deploy automatico

Il file `client/render.yaml` è già configurato correttamente.

## Modifiche apportate per il deployment

### Frontend (client/package.json)
- Spostato `vite`, `@vitejs/plugin-react` e `typescript` in `dependencies` (richiesto per Render)
- Aggiunto `.node-version` con Node 20

### Backend (server/index.js)
- Aggiunto CORS per il dominio Render: `https://gestionale-termoidraulico-frontend.onrender.com`

## URL finali

Una volta deployato il frontend, avrai:
- **Frontend**: https://gestionale-termoidraulico-frontend.onrender.com
- **Backend**: https://gestionale-termoidraulico-api.onrender.com
- **Database**: PostgreSQL su Render

## Credenziali Admin

- **Email**: admin@gestionale.local
- **Password**: admin123

## Test post-deployment

1. Vai al frontend deployato
2. Fai login con le credenziali admin
3. Testa tutte le funzionalità:
   - Dashboard
   - Gestione clienti
   - Gestione password (solo admin)
   - Gestione utenti (solo admin)

Il sistema è pronto per l'uso!
