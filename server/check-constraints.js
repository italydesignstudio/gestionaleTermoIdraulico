const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://gestionale_user:d5Bfdx1qUpgqaoZwr9rcysQ0DJEW3ACt@dpg-d2k7c66mcj7s73a0l4dg-a.frankfurt-postgres.render.com/gestionale_swsb';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkConstraints() {
    try {
        console.log('🔄 Verifica constraints...');
        
        // Verifica constraint sul ruolo
        const constraints = await pool.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conrelid = 'utenti'::regclass
        `);
        
        console.log('📋 Constraints sulla tabella utenti:');
        constraints.rows.forEach(row => {
            console.log(`   ${row.conname}: ${row.definition}`);
        });

        // Verifica anche la struttura completa della tabella utenti
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'utenti' AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Struttura tabella utenti:');
        columns.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
        });
        
    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await pool.end();
    }
}

checkConstraints();
