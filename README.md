# Gestionale Anagrafiche Clienti - Azienda Termoidraulica

## Descrizione
Sistema di gestione anagrafiche clienti per un'azienda termoidraulica con autenticazione, gestione ruoli e area riservata per dati sensibili.

## Caratteristiche
- ✅ Autenticazione con ruoli (Operatore/Amministratore)
- ✅ Gestione completa clienti (CRUD)
- ✅ Ricerca e filtri avanzati
- ✅ Tracciamento provenienza contatti
- ✅ Gestione consensi privacy/marketing
- ✅ Area riservata "Password e Info" (solo admin)
- ✅ UI responsive e intuitiva
- ✅ Validazione dati e gestione errori
- ✅ Logging delle modifiche

## Architettura
- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + TypeScript + Vite
- **Database**: SQLite con encryption per dati sensibili
- **Autenticazione**: JWT + bcrypt

## Struttura del progetto
```
gestionale-termoidraulico/
├── client/          # Frontend React
├── server/          # Backend Node.js
├── package.json     # Script di gestione
└── README.md        # Documentazione
```

## Avvio rapido

### Prerequisiti
- Node.js 18+
- npm

### Installazione
```bash
# Installa dipendenze root
npm install

# Installa dipendenze server
cd server && npm install

# Installa dipendenze client
cd ../client && npm install
```

### Avvio in sviluppo
```bash
# Avvia sia server che client
npm run dev

# Oppure separatamente:
npm run server  # Backend su http://localhost:3000
npm run client  # Frontend su http://localhost:5173
```

### Build per produzione
```bash
npm run build
```

## Utenti di prova
- **Admin**: admin@termoidraulico.it / password123
- **Operatore**: operatore@termoidraulico.it / password123

## API Endpoints

### Autenticazione
- `POST /api/utenti/register` - Registrazione
- `POST /api/utenti/login` - Login

### Clienti
- `GET /api/clienti` - Lista clienti con ricerca/filtri
- `POST /api/clienti` - Nuovo cliente
- `GET /api/clienti/:id` - Dettaglio cliente
- `PUT /api/clienti/:id` - Modifica cliente
- `DELETE /api/clienti/:id` - Elimina cliente (solo admin)

### Password e Info (solo admin)
- `GET /api/password-info` - Lista dati sensibili
- `POST /api/password-info` - Nuovo dato sensibile
- `PUT /api/password-info/:id` - Modifica dato sensibile
- `DELETE /api/password-info/:id` - Elimina dato sensibile

## Sicurezza
- Autenticazione JWT
- Password hashate con bcrypt
- Dati sensibili cifrati con AES-256
- Validazione input rigorosa
- Controllo ruoli per operazioni critiche

## Testing
- Postman collection inclusa
- Dati di test precaricati
- 10+ clienti fittizi

## Note tecniche
- Database SQLite per facilità deployment
- Crittografia lato server per dati sensibili
- Logging completo delle operazioni
- UI responsive con Bootstrap
- Validazione real-time dei form
