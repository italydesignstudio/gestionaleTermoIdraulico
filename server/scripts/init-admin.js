const bcrypt = require('bcryptjs');
const db = require('../database-pg');

async function createAdminUser() {
    try {
        console.log('🔄 Inizializzazione utente admin...');

        // Verifica se esiste già un admin
        const existingAdmin = await db.get(
            "SELECT email FROM utenti WHERE ruolo = 'Amministratore' LIMIT 1"
        );

        if (existingAdmin) {
            console.log('✅ Utente admin già esistente:', existingAdmin.email);
            return;
        }

        // Dati admin di default
        const adminData = {
            nome: 'Admin',
            cognome: 'Sistema',
            email: 'admin@termoidraulico.com',
            password: 'Admin123!', // Password temporanea - da cambiare al primo accesso
            ruolo: 'Amministratore'
        };

        // Hash password
        const hashedPassword = await bcrypt.hash(adminData.password, 12);

        // Crea admin
        const result = await db.query(`
            INSERT INTO utenti (nome, cognome, email, password, ruolo) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING utenteid
        `, [
            adminData.nome,
            adminData.cognome, 
            adminData.email,
            hashedPassword,
            adminData.ruolo
        ]);

        const utenteId = result.rows[0].utenteid;

        console.log('✅ Utente admin creato con successo!');
        console.log('📧 Email:', adminData.email);
        console.log('🔐 Password temporanea:', adminData.password);
        console.log('⚠️  IMPORTANTE: Cambiare la password al primo accesso!');
        console.log('🆔 ID Utente:', utenteId);

        // Log dell'operazione
        await db.logActivity(utenteId, 'CREATE', 'utenti', utenteId, 'Utente admin iniziale creato');

    } catch (error) {
        console.error('❌ Errore creazione admin:', error);
        throw error;
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    createAdminUser()
        .then(() => {
            console.log('🎉 Inizializzazione completata!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Errore fatale:', error);
            process.exit(1);
        });
}

module.exports = { createAdminUser };
