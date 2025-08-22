const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbPath = path.join(__dirname, 'database.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Errore connessione database:', err);
                throw err;
            }
            console.log('✅ Database SQLite connesso');
            this.createTables();
        });
    }

    createTables() {
        // Tabella utenti
        const createUtentiTable = `
            CREATE TABLE IF NOT EXISTS utenti (
                utenteId INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                cognome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                ruolo TEXT CHECK(ruolo IN ('Operatore', 'Amministratore')) NOT NULL DEFAULT 'Operatore',
                dataCreazione DATETIME DEFAULT CURRENT_TIMESTAMP,
                ultimoAccesso DATETIME
            )
        `;

        // Tabella clienti
        const createClientiTable = `
            CREATE TABLE IF NOT EXISTS clienti (
                clienteId INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                cognome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                telefono TEXT NOT NULL,
                indirizzo TEXT,
                citta TEXT,
                cap TEXT,
                provincia TEXT,
                provenienzaContatto TEXT CHECK(provenienzaContatto IN (
                    'Passaparola', 'Google', 'Facebook', 'Instagram', 'Volantino', 
                    'Giornale', 'Radio', 'TV', 'Sito web', 'Cliente esistente', 'Altro'
                )) NOT NULL,
                consensoPrivacy BOOLEAN NOT NULL DEFAULT 0,
                consensoMarketing BOOLEAN NOT NULL DEFAULT 0,
                note TEXT,
                dataCreazione DATETIME DEFAULT CURRENT_TIMESTAMP,
                dataModifica DATETIME DEFAULT CURRENT_TIMESTAMP,
                utenteCreazione INTEGER,
                utenteModifica INTEGER,
                FOREIGN KEY (utenteCreazione) REFERENCES utenti(utenteId),
                FOREIGN KEY (utenteModifica) REFERENCES utenti(utenteId)
            )
        `;

        // Tabella password e info sensibili (versione estesa)
        const createPasswordInfoTable = `
            CREATE TABLE IF NOT EXISTS password_info (
                infoId INTEGER PRIMARY KEY AUTOINCREMENT,
                titolo TEXT NOT NULL,
                categoria TEXT CHECK(categoria IN (
                    'Termoidraulica', 'Email', 'Software', 'PA_Fiscale', 'E-commerce', 
                    'Servizi_Web', 'Fornitori', 'Bancario', 'Social', 'Altro'
                )) DEFAULT 'Altro',
                url TEXT,
                username TEXT,
                email TEXT,
                passwordCifrata TEXT NOT NULL,
                codici TEXT,
                descrizione TEXT,
                note TEXT,
                dataInserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
                dataModifica DATETIME DEFAULT CURRENT_TIMESTAMP,
                utenteCreazione INTEGER NOT NULL,
                utenteModifica INTEGER,
                FOREIGN KEY (utenteCreazione) REFERENCES utenti(utenteId),
                FOREIGN KEY (utenteModifica) REFERENCES utenti(utenteId)
            )
        `;

        // Tabella log attività
        const createLogTable = `
            CREATE TABLE IF NOT EXISTS log_attivita (
                logId INTEGER PRIMARY KEY AUTOINCREMENT,
                utenteId INTEGER NOT NULL,
                azione TEXT NOT NULL,
                tabella TEXT NOT NULL,
                recordId INTEGER,
                dettagli TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (utenteId) REFERENCES utenti(utenteId)
            )
        `;

        // Esegui creazione tabelle
        this.db.serialize(() => {
            this.db.run(createUtentiTable);
            this.db.run(createClientiTable);
            this.db.run(createPasswordInfoTable);
            this.db.run(createLogTable);
            console.log('✅ Tabelle database create/verificate');
        });
    }

    // Metodi per gestione dati sensibili
    encrypt(text) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'your_32_char_encryption_key_123456', 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(text) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'your_32_char_encryption_key_123456', 'salt', 32);
        
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = textParts.join(':');
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // Metodo per logging
    logActivity(utenteId, azione, tabella, recordId = null, dettagli = null) {
        const sql = `
            INSERT INTO log_attivita (utenteId, azione, tabella, recordId, dettagli)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        this.db.run(sql, [utenteId, azione, tabella, recordId, dettagli], (err) => {
            if (err) {
                console.error('Errore logging:', err);
            }
        });
    }

    // Wrapper per promisificare le query
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = new Database();
