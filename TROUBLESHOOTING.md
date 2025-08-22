# Troubleshooting 401 Error - Frontend Login

## Status Attuale

✅ **Backend API**: Funziona perfettamente
- Health check: OK
- CORS: Configurato correttamente
- Login endpoint: Funziona con curl/Postman
- Credenziali admin: admin@gestionale.local / admin123

❌ **Frontend**: Errore 401 nel login

## Test Eseguiti

1. **Curl Test**: ✅ Login funziona
2. **CORS Test**: ✅ Preflight request OK
3. **API Endpoints**: ✅ Tutti funzionanti

## Possibili Cause

### 1. Environment Variables (Più Probabile)
- `VITE_API_BASE_URL` non impostato su Render
- Frontend chiama localhost invece dell'API di produzione

### 2. Cache del Browser
- Browser ha cachato versione vecchia
- Service worker interferenze

### 3. Dati del Form
- Frontend invia dati in formato diverso
- Encoding problemi

## Debug Attivato

### Backend Logs
```javascript
console.log('Login request received:', req.body);
console.log('Request headers:', req.headers);
console.log('User found:', user ? 'Yes' : 'No');
console.log('Password valid:', validPassword);
```

### Frontend Logs
```javascript
console.log('API_BASE_URL configurato:', API_BASE_URL);
console.log('Environment variables:', import.meta.env);
console.log('Login attempt with:', credentials);
console.log('API base URL:', api.defaults.baseURL);
```

## Iterazione 2 - Debugging Attivo

### Problemi Identificati
1. **Frontend non aggiornato**: I logs di debug non appaiono
2. **Environment Variable**: Potrebbe non essere letta correttamente
3. **Deploy cache**: Render potrebbe aver cachato build vecchia

### Soluzioni Implementate
1. **Hardcode API URL**: Fallback diretto all'API di produzione
2. **Debug logs startup**: Logs all'avvio del frontend
3. **Force redeploy**: Modifiche per forzare nuovo build

### Test da Eseguire
Nel browser del frontend deployato:
```javascript
// 1. Verificare environment
console.log(import.meta.env.VITE_API_BASE_URL);

// 2. Verificare API base
console.log(window.location.origin);

// 3. Test manuale login
fetch('https://gestionale-termoidraulico-api.onrender.com/api/utenti/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({email: 'admin@gestionale.local', password: 'admin123'})
}).then(r => r.json()).then(console.log);
```

## Prossimi Passi

1. **Controllare Console Browser** su https://gestionale-termoidraulico-frontend.onrender.com
2. **Verificare Environment Variables** su Render
3. **Controllare Network Tab** per vedere richieste effettive
4. **Logs Backend** su Render per vedere se riceve richieste

## Soluzione Rapida

Se il problema è la variabile d'ambiente, aggiungere su Render:
```
VITE_API_BASE_URL=https://gestionale-termoidraulico-api.onrender.com/api
```

## Note

- API backend completamente funzionale
- CORS configurato correttamente
- Il problema è lato frontend o configurazione
