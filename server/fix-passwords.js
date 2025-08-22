const bcrypt = require('bcryptjs');
const db = require('./database');

async function fixPasswords() {
    try {
        console.log('🔧 Aggiornamento password utenti...');
        
        // Password da usare per entrambi gli utenti
        const testPassword = 'password123';
        const hashedPassword = await bcrypt.hash(testPassword, 12);
        
        console.log('🔒 Hash generato per "password123":', hashedPassword.substring(0, 20) + '...');
        
        // Aggiorna entrambi gli utenti
        await db.run(
            'UPDATE utenti SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@termoidraulico.it']
        );
        
        await db.run(
            'UPDATE utenti SET password = ? WHERE email = ?',
            [hashedPassword, 'operatore@termoidraulico.it']
        );
        
        console.log('✅ Password aggiornate per entrambi gli utenti');
        
        // Verifica test
        const users = await db.all('SELECT email, substr(password, 1, 20) as pwd_start FROM utenti');
        console.log('👥 Utenti nel database:');
        users.forEach(user => {
            console.log(`   - ${user.email}: ${user.pwd_start}...`);
        });
        
        // Test di verifica password
        const testUser = await db.get('SELECT * FROM utenti WHERE email = ?', ['admin@termoidraulico.it']);
        const isValid = await bcrypt.compare(testPassword, testUser.password);
        console.log('🧪 Test password "password123" per admin:', isValid ? '✅ VALIDA' : '❌ NON VALIDA');
        
        console.log('\n📋 Credenziali da usare:');
        console.log('   Admin: admin@termoidraulico.it / password123');
        console.log('   Operatore: operatore@termoidraulico.it / password123');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Errore:', error);
        process.exit(1);
    }
}

fixPasswords();
