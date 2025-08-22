# API Documentation - Gestionale Termoidraulico

## Introduzione

API REST per il sistema di gestione anagrafiche clienti per azienda termoidraulica.

**Base URL**: `http://localhost:3000/api`

## Autenticazione

L'API utilizza JWT (JSON Web Tokens) per l'autenticazione. Include l'header Authorization in tutte le richieste protette:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Autenticazione

#### POST /utenti/register
Registra un nuovo utente.

**Request Body:**
```json
{
  "nome": "Mario",
  "cognome": "Rossi",
  "email": "mario.rossi@email.it",
  "password": "password123",
  "ruolo": "Operatore"
}
```

**Response:**
```json
{
  "message": "Utente registrato con successo",
  "utenteId": 1,
  "user": {
    "utenteId": 1,
    "nome": "Mario",
    "cognome": "Rossi",
    "email": "mario.rossi@email.it",
    "ruolo": "Operatore"
  }
}
```

#### POST /utenti/login
Effettua il login.

**Request Body:**
```json
{
  "email": "admin@termoidraulico.it",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login effettuato con successo",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "utenteId": 1,
    "nome": "Admin",
    "cognome": "User",
    "email": "admin@termoidraulico.it",
    "ruolo": "Amministratore"
  }
}
```

#### GET /utenti/me
Ottiene il profilo dell'utente corrente. **[Autenticazione richiesta]**

**Response:**
```json
{
  "user": {
    "utenteId": 1,
    "nome": "Admin",
    "cognome": "User",
    "email": "admin@termoidraulico.it",
    "ruolo": "Amministratore",
    "dataCreazione": "2024-01-15T10:30:00.000Z",
    "ultimoAccesso": "2024-01-15T15:45:00.000Z"
  }
}
```

### Gestione Clienti

#### GET /clienti
Ottiene la lista dei clienti con filtri e paginazione. **[Autenticazione richiesta]**

**Query Parameters:**
- `search` (string): Ricerca per nome, cognome, email o telefono
- `provenienzaContatto` (string): Filtra per provenienza
- `consensoMarketing` (boolean): Filtra per consenso marketing
- `page` (number): Numero pagina (default: 1)
- `limit` (number): Elementi per pagina (default: 50)
- `sortBy` (string): Campo di ordinamento (default: cognome)
- `sortOrder` (string): ASC o DESC (default: ASC)

**Response:**
```json
{
  "clienti": [
    {
      "clienteId": 1,
      "nome": "Marco",
      "cognome": "Verdi",
      "email": "marco.verdi@email.it",
      "telefono": "+39 345 678 9012",
      "indirizzo": "Via Roma 123",
      "citta": "Milano",
      "cap": "20100",
      "provincia": "MI",
      "provenienzaContatto": "Google",
      "consensoPrivacy": true,
      "consensoMarketing": true,
      "note": "Cliente interessato a caldaia a condensazione",
      "dataCreazione": "2024-01-15T10:30:00.000Z",
      "dataModifica": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "current": 1,
    "total": 5,
    "hasNext": true,
    "hasPrev": false,
    "totalRecords": 25
  },
  "filters": {
    "search": "",
    "provenienzaContatto": "",
    "consensoMarketing": ""
  }
}
```

#### GET /clienti/stats
Ottiene statistiche sui clienti. **[Autenticazione richiesta]**

**Response:**
```json
{
  "totaleClienti": 12,
  "provenienzaContatto": [
    {"provenienzaContatto": "Google", "count": 4},
    {"provenienzaContatto": "Passaparola", "count": 3},
    {"provenienzaContatto": "Facebook", "count": 2}
  ],
  "consensoMarketing": [
    {"tipo": "Con consenso", "count": 8},
    {"tipo": "Senza consenso", "count": 4}
  ],
  "andamentoMensile": [
    {"mese": "2024-01", "count": 5},
    {"mese": "2024-02", "count": 7}
  ]
}
```

#### GET /clienti/:id
Ottiene i dettagli di un cliente specifico. **[Autenticazione richiesta]**

**Response:**
```json
{
  "cliente": {
    "clienteId": 1,
    "nome": "Marco",
    "cognome": "Verdi",
    "email": "marco.verdi@email.it",
    "telefono": "+39 345 678 9012",
    "indirizzo": "Via Roma 123",
    "citta": "Milano",
    "cap": "20100",
    "provincia": "MI",
    "provenienzaContatto": "Google",
    "consensoPrivacy": true,
    "consensoMarketing": true,
    "note": "Cliente interessato a caldaia a condensazione",
    "dataCreazione": "2024-01-15T10:30:00.000Z",
    "dataModifica": "2024-01-15T10:30:00.000Z",
    "nomeUtenteCreazione": "Admin",
    "cognomeUtenteCreazione": "User",
    "nomeUtenteModifica": "Admin",
    "cognomeUtenteModifica": "User"
  }
}
```

#### POST /clienti
Crea un nuovo cliente. **[Autenticazione richiesta]**

**Request Body:**
```json
{
  "nome": "Anna",
  "cognome": "Bianchi",
  "email": "anna.bianchi@email.it",
  "telefono": "+39 333 456 7890",
  "indirizzo": "Via Dante 45",
  "citta": "Roma",
  "cap": "00100",
  "provincia": "RM",
  "provenienzaContatto": "Passaparola",
  "consensoPrivacy": true,
  "consensoMarketing": false,
  "note": "Richiesta preventivo per rifacimento bagno"
}
```

**Response:**
```json
{
  "message": "Cliente creato con successo",
  "clienteId": 13
}
```

#### PUT /clienti/:id
Modifica un cliente esistente. **[Autenticazione richiesta]**

**Request Body:** (stesso formato del POST)

**Response:**
```json
{
  "message": "Cliente aggiornato con successo"
}
```

#### DELETE /clienti/:id
Elimina un cliente. **[Solo Amministratori]**

**Response:**
```json
{
  "message": "Cliente eliminato con successo"
}
```

### Password e Info Sensibili (Solo Amministratori)

#### GET /password-info
Ottiene la lista delle informazioni sensibili. **[Solo Amministratori]**

**Query Parameters:**
- `search` (string): Ricerca per titolo o descrizione
- `page` (number): Numero pagina (default: 1)
- `limit` (number): Elementi per pagina (default: 20)

**Response:**
```json
{
  "passwordInfo": [
    {
      "infoId": 1,
      "titolo": "Accesso Router Ufficio",
      "descrizione": "Credenziali per accesso al router principale",
      "valoreMascherato": "••••••••",
      "dataInserimento": "2024-01-15T10:30:00.000Z",
      "dataModifica": "2024-01-15T10:30:00.000Z",
      "nomeUtenteCreazione": "Admin",
      "cognomeUtenteCreazione": "User"
    }
  ],
  "pagination": {
    "current": 1,
    "total": 2,
    "hasNext": false,
    "hasPrev": false,
    "totalRecords": 5
  }
}
```

#### GET /password-info/:id
Ottiene i dettagli completi di un'informazione sensibile (con valore decifrato). **[Solo Amministratori]**

**Response:**
```json
{
  "info": {
    "infoId": 1,
    "titolo": "Accesso Router Ufficio",
    "descrizione": "Credenziali per accesso al router principale",
    "valore": "admin / SuperPassword2024!",
    "dataInserimento": "2024-01-15T10:30:00.000Z",
    "dataModifica": "2024-01-15T10:30:00.000Z",
    "nomeUtenteCreazione": "Admin",
    "cognomeUtenteCreazione": "User"
  }
}
```

#### POST /password-info
Crea una nuova informazione sensibile. **[Solo Amministratori]**

**Request Body:**
```json
{
  "titolo": "Database Production",
  "descrizione": "Password per database di produzione",
  "valore": "mySecretPassword123!"
}
```

**Response:**
```json
{
  "message": "Informazione salvata con successo",
  "infoId": 6
}
```

#### PUT /password-info/:id
Modifica un'informazione sensibile. **[Solo Amministratori]**

**Request Body:** (stesso formato del POST)

**Response:**
```json
{
  "message": "Informazione aggiornata con successo"
}
```

#### DELETE /password-info/:id
Elimina un'informazione sensibile. **[Solo Amministratori]**

**Response:**
```json
{
  "message": "Informazione eliminata con successo"
}
```

#### PUT /password-info/:id/reveal
Rivela temporaneamente il valore di un'informazione sensibile. **[Solo Amministratori]**

**Response:**
```json
{
  "valore": "mySecretPassword123!"
}
```

## Codici di Errore

### 400 - Bad Request
```json
{
  "error": "Errori di validazione",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "msg": "Email non valida",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "error": "Token di accesso richiesto",
  "code": "TOKEN_REQUIRED"
}
```

### 403 - Forbidden
```json
{
  "error": "Accesso riservato agli amministratori",
  "code": "ADMIN_REQUIRED"
}
```

### 404 - Not Found
```json
{
  "error": "Cliente non trovato",
  "code": "CLIENT_NOT_FOUND"
}
```

### 429 - Too Many Requests
```json
{
  "error": "Troppe richieste da questo IP, riprova più tardi",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### 500 - Internal Server Error
```json
{
  "error": "Errore interno del server",
  "code": "INTERNAL_ERROR"
}
```

## Regole di Validazione

### Cliente
- `nome`: Obbligatorio, 2-50 caratteri, solo lettere, spazi e apostrofi
- `cognome`: Obbligatorio, 2-50 caratteri, solo lettere, spazi e apostrofi
- `email`: Obbligatorio, formato email valido, univoco
- `telefono`: Obbligatorio, formato italiano (+39 XXX XXX XXXX)
- `cap`: Opzionale, 5 cifre
- `provincia`: Opzionale, 2 caratteri maiuscoli
- `provenienzaContatto`: Obbligatorio, uno dei valori predefiniti
- `consensoPrivacy`: Obbligatorio, deve essere `true`
- `consensoMarketing`: Opzionale, boolean
- `note`: Opzionale, max 1000 caratteri

### Utente
- `nome`: Obbligatorio, 2-50 caratteri
- `cognome`: Obbligatorio, 2-50 caratteri
- `email`: Obbligatorio, formato email valido, univoco
- `password`: Obbligatorio, min 8 caratteri, deve contenere maiuscole, minuscole e numeri
- `ruolo`: Opzionale, "Operatore" o "Amministratore"

### Password Info
- `titolo`: Obbligatorio, 3-100 caratteri
- `descrizione`: Opzionale, max 500 caratteri
- `valore`: Obbligatorio, 1-1000 caratteri

## Sicurezza

- Password hashate con bcrypt (12 rounds)
- Informazioni sensibili cifrate con AES-256
- Rate limiting: 100 richieste per 15 minuti per IP
- Logging completo delle operazioni
- Validazione rigorosa di tutti gli input
- Controllo ruoli per operazioni critiche
