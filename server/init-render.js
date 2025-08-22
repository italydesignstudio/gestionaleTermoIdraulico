const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// URL del database Render
const DATABASE_URL = 'postgresql://gestionale_user:d5Bfdx1qUpgqaoZwr9rcysQ0DJEW3ACt@dpg-d2k7c66mcj7s73a0l4dg-a.frankfurt-postgres.render.com/gestionale_swsb';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initRenderDatabase() {
    try {
        console.log('🔄 Connessione al database Render...');
        
        // Test connessione
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Connesso al database PostgreSQL Render');
        console.log(`🕒 Timestamp server: ${result.rows[0].now}`);

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
        console.log('✅ Tabella utenti creata/verificata');

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
        console.log('✅ Tabella clienti creata/verificata');

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
        console.log('✅ Tabella password_info creata/verificata');

        // Verifica se admin esiste già
        const adminExists = await pool.query(
            'SELECT username FROM utenti WHERE username = $1',
            ['admin']
        );

        if (adminExists.rows.length > 0) {
            console.log('ℹ️  Utente admin già esistente');
            
            // Mostra info admin esistente
            const adminInfo = await pool.query(
                'SELECT username, ruolo, email, created_at FROM utenti WHERE username = $1',
                ['admin']
            );
            console.log('📋 Info admin esistente:', adminInfo.rows[0]);
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

        // Verifica tabelle create
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('📋 Tabelle nel database:');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        console.log('🎉 Inizializzazione database Render completata!');
        console.log('');
        console.log('🔗 URL Frontend: https://gestionale-termoidraulico-frontend.onrender.com');
        console.log('🔗 URL Backend: https://gestionale-termoidraulico-api.onrender.com');
        console.log('🔗 Health Check: https://gestionale-termoidraulico-api.onrender.com/api/health');
        
    } catch (error) {
        console.error('❌ Errore durante l\'inizializzazione:', error);
        if (error.code) {
            console.error(`❌ Codice errore: ${error.code}`);
        }
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initRenderDatabase();
