const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://gestionale_user:d5Bfdx1qUpgqaoZwr9rcysQ0DJEW3ACt@dpg-d2k7c66mcj7s73a0l4dg-a.frankfurt-postgres.render.com/gestionale_swsb';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initAdmin() {
    try {
        console.log('🔄 Connessione al database Render...');
        
        await pool.query('SELECT NOW()');
        console.log('✅ Connesso al database Render');

        // La struttura della tabella utenti è:
        // utenteid, nome, cognome, email, password, ruolo, datacreazione, ultimoaccesso

        // Verifica se admin esiste già
        console.log('🔄 Verifica utente admin...');
        const adminExists = await pool.query(
            'SELECT utenteid, nome, cognome, email, ruolo FROM utenti WHERE email = $1 OR (nome = $2 AND cognome = $3)',
            ['admin@gestionale.local', 'Admin', 'User']
        );

        if (adminExists.rows.length > 0) {
            console.log('ℹ️  Utente admin già esistente:');
            adminExists.rows.forEach(admin => {
                console.log(`   ID: ${admin.utenteid}`);
                console.log(`   Nome: ${admin.nome} ${admin.cognome}`);
                console.log(`   Email: ${admin.email}`);
                console.log(`   Ruolo: ${admin.ruolo}`);
            });
        } else {
            // Crea utente admin
            console.log('🔄 Creazione utente admin...');
            const passwordHash = await bcrypt.hash('admin123', 10);
            
            const result = await pool.query(
                'INSERT INTO utenti (nome, cognome, email, password, ruolo, datacreazione) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING utenteid',
                ['Admin', 'User', 'admin@gestionale.local', passwordHash, 'Amministratore']
            );
            
            console.log('✅ Utente admin creato con successo!');
            console.log(`📝 ID: ${result.rows[0].utenteid}`);
            console.log('📝 Credenziali: admin@gestionale.local / admin123');
            console.log('💡 Per il login usa: admin@gestionale.local');
        }

        // Verifica numero clienti
        const clientCount = await pool.query('SELECT COUNT(*) as count FROM clienti');
        console.log(`📊 Clienti nel database: ${clientCount.rows[0].count}`);

        // Verifica numero password info
        const passwordCount = await pool.query('SELECT COUNT(*) as count FROM password_info');
        console.log(`🔐 Password info nel database: ${passwordCount.rows[0].count}`);

        console.log('🎉 Database Render configurato!');
        console.log('');
        console.log('🔗 URL Frontend: https://gestionale-termoidraulico-frontend.onrender.com');
        console.log('🔗 Backend API: (inserisci l\'URL del tuo backend Render)');
        
    } catch (error) {
        console.error('❌ Errore:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initAdmin();
