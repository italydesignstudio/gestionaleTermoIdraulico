const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

class Database {
    constructor() {
        this.pool = null;
        this.init();
    }

    init() {
        // Configurazione per PostgreSQL con supporto per diversi ambienti
        const config = {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };

        // Se non c'è DATABASE_URL, usa configurazione locale
        if (!process.env.DATABASE_URL) {
            config.user = process.env.DB_USER || 'postgres';
            config.host = process.env.DB_HOST || 'localhost';
            config.database = process.env.DB_NAME || 'gestionale_termoidraulico';
            config.password = process.env.DB_PASSWORD || 'password';
            config.port = process.env.DB_PORT || 5432;
            delete config.connectionString;
        }

        this.pool = new Pool(config);

        this.pool.on('error', (err, client) => {
            console.error('Errore inaspettato client database:', err);
        });

        // Test connessione
        this.testConnection();
    }

    async testConnection() {
        try {
            const client = await this.pool.connect();
            console.log('✅ Database PostgreSQL connesso');
            client.release();
            await this.createTables();
        } catch (err) {
            console.error('❌ Errore connessione database:', err);
            throw err;
        }
    }

    async createTables() {
        const client = await this.pool.connect();
        
        try {
            // Inizia transazione
            await client.query('BEGIN');

            // Tabella utenti
            const createUtentiTable = `
                CREATE TABLE IF NOT EXISTS utenti (
                    utenteId SERIAL PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL,
                    cognome VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    ruolo VARCHAR(50) CHECK(ruolo IN ('Operatore', 'Amministratore')) NOT NULL DEFAULT 'Operatore',
                    dataCreazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ultimoAccesso TIMESTAMP
                )
            `;

            // Tabella clienti
            const createClientiTable = `
                CREATE TABLE IF NOT EXISTS clienti (
                    clienteId SERIAL PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL,
                    cognome VARCHAR(255) NOT NULL,
                    codiceFiscale VARCHAR(16) UNIQUE,
                    email VARCHAR(255) UNIQUE,
                    telefono VARCHAR(50) NOT NULL,
                    indirizzo TEXT,
                    citta VARCHAR(255),
                    cap VARCHAR(10),
                    provincia VARCHAR(10),
                    provenienzaContatto VARCHAR(50) CHECK(provenienzaContatto IN (
                        'Passaparola', 'Google', 'Facebook', 'Instagram', 'Volantino',
                        'Giornale', 'Radio', 'TV', 'Sito web', 'Cliente esistente', 'Altro'
                    )) NOT NULL,
                    consensoPrivacy BOOLEAN NOT NULL DEFAULT FALSE,
                    consensoMarketing BOOLEAN NOT NULL DEFAULT FALSE,
                    note TEXT,
                    dataCreazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    dataModifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    utenteCreazione INTEGER REFERENCES utenti(utenteId),
                    utenteModifica INTEGER REFERENCES utenti(utenteId)
                )
            `;

            // Tabella password e info sensibili
            const createPasswordInfoTable = `
                CREATE TABLE IF NOT EXISTS password_info (
                    infoId SERIAL PRIMARY KEY,
                    titolo VARCHAR(255) NOT NULL,
                    categoria VARCHAR(50) CHECK(categoria IN (
                        'Termoidraulica', 'Email', 'Software', 'PA_Fiscale', 'E-commerce', 
                        'Servizi_Web', 'Fornitori', 'Bancario', 'Social', 'Altro'
                    )) DEFAULT 'Altro',
                    url TEXT,
                    username VARCHAR(255),
                    email VARCHAR(255),
                    passwordCifrata TEXT NOT NULL,
                    codici TEXT,
                    descrizione TEXT,
                    note TEXT,
                    dataInserimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    dataModifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    utenteCreazione INTEGER NOT NULL REFERENCES utenti(utenteId),
                    utenteModifica INTEGER REFERENCES utenti(utenteId)
                )
            `;

            // Tabella log attività
            const createLogTable = `
                CREATE TABLE IF NOT EXISTS log_attivita (
                    logId SERIAL PRIMARY KEY,
                    utenteId INTEGER NOT NULL REFERENCES utenti(utenteId),
                    azione VARCHAR(255) NOT NULL,
                    tabella VARCHAR(100) NOT NULL,
                    recordId INTEGER,
                    dettagli TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Tabella documenti cliente (fatture, scontrini, libretti)
            const createDocumentiTable = `
                CREATE TABLE IF NOT EXISTS documenti_cliente (
                    documentoId SERIAL PRIMARY KEY,
                    clienteId INTEGER NOT NULL REFERENCES clienti(clienteId) ON DELETE CASCADE,
                    tipoDocumento VARCHAR(50) NOT NULL CHECK(tipoDocumento IN (
                        'Fattura', 'Scontrino', 'Libretto', 'Preventivo', 'Contratto', 
                        'Certificazione', 'Garanzia', 'Altro'
                    )),
                    titolo VARCHAR(255) NOT NULL,
                    descrizione TEXT,
                    nomeFile VARCHAR(255) NOT NULL,
                    pathFile TEXT NOT NULL,
                    dimensioneFile INTEGER,
                    mimeType VARCHAR(100),
                    dataCreazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    utenteCreazione INTEGER NOT NULL REFERENCES utenti(utenteId)
                )
            `;

            // Tabella comunicazioni cliente (WhatsApp, email, chiamate, note)
            const createComunicazioniTable = `
                CREATE TABLE IF NOT EXISTS comunicazioni_cliente (
                    comunicazioneId SERIAL PRIMARY KEY,
                    clienteId INTEGER NOT NULL REFERENCES clienti(clienteId) ON DELETE CASCADE,
                    tipoComunicazione VARCHAR(50) NOT NULL CHECK(tipoComunicazione IN (
                        'Chiamata', 'WhatsApp', 'Email', 'SMS', 'Nota', 'Promemoria', 'Altro'
                    )),
                    oggetto VARCHAR(255),
                    contenuto TEXT NOT NULL,
                    dataOra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    statoLettura BOOLEAN DEFAULT FALSE,
                    priorita VARCHAR(20) DEFAULT 'Media' CHECK(priorita IN ('Bassa', 'Media', 'Alta', 'Urgente')),
                    utenteCreazione INTEGER NOT NULL REFERENCES utenti(utenteId),
                    CONSTRAINT unique_comunicazione_utente UNIQUE(comunicazioneId, utenteCreazione)
                )
            `;

            // Esegui creazione tabelle
            await client.query(createUtentiTable);
            await client.query(createClientiTable);
            await client.query("ALTER TABLE clienti ADD COLUMN IF NOT EXISTS codiceFiscale VARCHAR(16);");
            try {
                await client.query("ALTER TABLE clienti ADD CONSTRAINT unique_codicefiscale UNIQUE (codiceFiscale);");
            } catch (e) {
                // ignore if constraint exists
            }
            await client.query("ALTER TABLE clienti ALTER COLUMN email DROP NOT NULL;");
            await client.query(createPasswordInfoTable);
            await client.query(createLogTable);
            await client.query(createDocumentiTable);
            await client.query(createComunicazioniTable);

            // Crea indici per performance
            await client.query('CREATE INDEX IF NOT EXISTS idx_clienti_email ON clienti(email)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_utenti_email ON utenti(email)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_log_attivita_utente ON log_attivita(utenteId)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_log_attivita_timestamp ON log_attivita(timestamp)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_documenti_cliente ON documenti_cliente(clienteId)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_comunicazioni_cliente ON comunicazioni_cliente(clienteId)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_comunicazioni_data ON comunicazioni_cliente(dataOra)');

            await client.query('COMMIT');
            console.log('✅ Tabelle PostgreSQL create/verificate');

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Errore creazione tabelle:', error);
            throw error;
        } finally {
            client.release();
        }
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
    async logActivity(utenteId, azione, tabella, recordId = null, dettagli = null) {
        const sql = `
            INSERT INTO log_attivita (utenteId, azione, tabella, recordId, dettagli)
            VALUES ($1, $2, $3, $4, $5)
        `;
        
        try {
            await this.query(sql, [utenteId, azione, tabella, recordId, dettagli]);
        } catch (err) {
            console.error('Errore logging:', err);
        }
    }

    // Wrapper per query con pool
    async query(text, params = []) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            if (process.env.NODE_ENV === 'development') {
                console.log('Query eseguita:', { text, duration, rows: res.rowCount });
            }
            return res;
        } catch (error) {
            console.error('Errore query database:', error);
            throw error;
        }
    }

    // Metodi per compatibilità con l'API esistente
    async all(sql, params = []) {
        const result = await this.query(sql, params);
        return result.rows;
    }

    async get(sql, params = []) {
        const result = await this.query(sql, params);
        return result.rows[0] || null;
    }

    async run(sql, params = []) {
        const result = await this.query(sql, params);
        return { 
            id: result.rows[0]?.id || result.rows[0]?.clienteid || result.rows[0]?.utenteid || result.rows[0]?.infoid,
            changes: result.rowCount 
        };
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('✅ Pool database chiuso');
        }
    }
}

module.exports = new Database();
