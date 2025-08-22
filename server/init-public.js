const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// URL pubblico per connessione esterna
const DATABASE_PUBLIC_URL = 'postgresql://postgres:kYwODeqsQhjmoUeQuDRBxNTOKkOKowVp@tramway.proxy.rlwy.net:42862/railway';

const pool = new Pool({
    connectionString: DATABASE_PUBLIC_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initAdmin() {
    try {
        console.log('🔄 Connessione al database...');
        
        // Test connessione
        await pool.query('SELECT NOW()');
        console.log('✅ Connesso al database PostgreSQL');

        // Crea tabelle se non esistono
        console.log('🔄 Creazione tabelle...');
        
        // Tabella utenti
        await pool.query(`
            CREATE TABLE IF NOT EXISTS utenti (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                ruolo VARCHAR(50) DEFAULT 'operatore' CHECK (ruolo IN ('operatore', 'amministratore')),
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Tabella clienti
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clienti (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                cognome VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                telefono VARCHAR(20),
                indirizzo TEXT,
                citta VARCHAR(100),
                cap VARCHAR(10),
                data_nascita DATE,
                codice_fiscale VARCHAR(16),
                partita_iva VARCHAR(11),
                provenienza VARCHAR(100),
                consenso_privacy BOOLEAN DEFAULT false,
                consenso_marketing BOOLEAN DEFAULT false,
                note TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Tabella password_info
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_info (
                id SERIAL PRIMARY KEY,
                sito VARCHAR(255) NOT NULL,
                url VARCHAR(500),
                username VARCHAR(255),
                password VARCHAR(255),
                note TEXT,
                categoria VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('✅ Tabelle create/verificate');

        // Verifica se admin esiste già
        const adminExists = await pool.query(
            'SELECT username FROM utenti WHERE username = $1',
            ['admin']
        );

        if (adminExists.rows.length > 0) {
            console.log('ℹ️  Utente admin già esistente');
        } else {
            // Crea utente admin
            console.log('🔄 Creazione utente admin...');
            const passwordHash = await bcrypt.hash('admin123', 10);
            
            await pool.query(
                'INSERT INTO utenti (username, password, ruolo, email) VALUES ($1, $2, $3, $4)',
                ['admin', passwordHash, 'amministratore', 'admin@gestionale.local']
            );
            
            console.log('✅ Utente admin creato con successo!');
            console.log('📝 Credenziali: admin / admin123');
        }

        console.log('🎉 Inizializzazione completata!');
        
    } catch (error) {
        console.error('❌ Errore durante l\'inizializzazione:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initAdmin();
