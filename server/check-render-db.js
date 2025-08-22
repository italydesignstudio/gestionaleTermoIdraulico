const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://gestionale_user:d5Bfdx1qUpgqaoZwr9rcysQ0DJEW3ACt@dpg-d2k7c66mcj7s73a0l4dg-a.frankfurt-postgres.render.com/gestionale_swsb';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkDatabase() {
    try {
        console.log('🔄 Verifica database Render...');
        
        // Verifica connessione
        await pool.query('SELECT NOW()');
        console.log('✅ Connesso');

        // Verifica tabelle esistenti
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('📋 Tabelle esistenti:');
        if (tables.rows.length === 0) {
            console.log('   (Nessuna tabella trovata)');
        } else {
            for (const row of tables.rows) {
                console.log(`   - ${row.table_name}`);
                
                // Mostra struttura di ogni tabella
                const columns = await pool.query(`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND table_schema = 'public'
                    ORDER BY ordinal_position
                `, [row.table_name]);
                
                console.log(`     Colonne:`);
                columns.rows.forEach(col => {
                    console.log(`       - ${col.column_name} (${col.data_type})`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await pool.end();
    }
}

checkDatabase();
