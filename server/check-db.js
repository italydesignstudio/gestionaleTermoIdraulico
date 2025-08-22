const { Pool } = require('pg');

const DATABASE_PUBLIC_URL = 'postgresql://postgres:kYwODeqsQhjmoUeQuDRBxNTOKkOKowVp@tramway.proxy.rlwy.net:42862/railway';

const pool = new Pool({
    connectionString: DATABASE_PUBLIC_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkTables() {
    try {
        console.log('🔄 Connessione al database...');
        
        // Verifica tabelle esistenti
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('📋 Tabelle esistenti:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        if (result.rows.length === 0) {
            console.log('  (Nessuna tabella trovata)');
        }
        
    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await pool.end();
    }
}

checkTables();
