# 🏗️ GESTIONALE TERMOIDRAULICO - PROGETTO COMPLETO

✅ **STATO**: Pronto per l'utilizzo

## 🚀 AVVIO IMMEDIATO

```bash
# Dalla directory principale
npm run dev
```

Questo comando avvia automaticamente:
- 🟢 **Backend** su http://localhost:3000
- 🟢 **Frontend** su http://localhost:5173

## 👥 CREDENZIALI TEST

**Amministratore:**
- 📧 Email: `admin@termoidraulico.it`
- 🔑 Password: `password123`

**Operatore:**
- 📧 Email: `operatore@termoidraulico.it`
- 🔑 Password: `password123`

## 📋 COMPONENTI IMPLEMENTATI

### ✅ BACKEND (Node.js + Express)
- Database SQLite inizializzato con dati di test
- 12 clienti di esempio precaricati
- API complete con autenticazione JWT
- Crittografia AES-256 per dati sensibili
- Middleware di validazione e sicurezza

### ✅ FRONTEND (React + TypeScript)
- **Dashboard** con statistiche e grafici
- **Lista Clienti** con ricerca e filtri
- **Form Cliente** completo e validato
- **Dettaglio Cliente** con tutte le informazioni
- **Gestione Password** (solo admin)
- **Gestione Utenti** (solo admin)
- **Sistema Login/Logout** con gestione sessioni

### ✅ SICUREZZA
- Autenticazione JWT
- Hash bcrypt per password
- Crittografia dati sensibili
- Controllo ruoli e permessi
- Validazione input completa

### ✅ TESTING & DOCUMENTAZIONE
- Collection Postman per test API
- Documentazione API completa
- Database con dati realistici
- README con istruzioni dettagliate

## 🎯 FUNZIONALITÀ PRINCIPALI

1. **Login** → Accesso con credenziali
2. **Dashboard** → Panoramica statistiche clienti
3. **Clienti** → Gestione completa anagrafica
4. **Password** → Gestione info sensibili (admin)
5. **Utenti** → Gestione accessi sistema (admin)

## 📊 DATABASE PRECONFIGURATO

- 2 utenti (admin + operatore)
- 12 clienti con dati realistici
- 3 informazioni password di esempio
- Schema completo ottimizzato

## 🔧 COMANDI UTILI

```bash
# Installazione completa
npm install

# Solo backend
npm run server

# Solo frontend  
npm run client

# Build produzione
npm run build

# Test API
npm run test
```

## 🌟 CARATTERISTICHE AVANZATE

- **Responsive Design** per mobile/tablet
- **Ricerca Real-time** con filtri multipli
- **Grafici Interattivi** per analytics
- **Notifiche Toast** per feedback utente
- **Validazione Form** completa
- **Export/Import** dati (implementabile)
- **Log Attività** per audit trail

## 🔐 CONTROLLI ACCESSO

| Funzionalità | Operatore | Admin |
|-------------|-----------|-------|
| Dashboard | ✅ | ✅ |
| Visualizza Clienti | ✅ | ✅ |
| Crea/Modifica Clienti | ✅ | ✅ |
| Elimina Clienti | ❌ | ✅ |
| Gestione Password | ❌ | ✅ |
| Gestione Utenti | ❌ | ✅ |

---

🎉 **Il sistema è completo e pronto per l'uso!**
