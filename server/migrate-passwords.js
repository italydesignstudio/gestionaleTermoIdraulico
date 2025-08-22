const db = require('./database');

async function migratePasswordInfo() {
    console.log('🔄 Inizio migrazione struttura password_info...');
    
    try {
        // 1. Prima creiamo una tabella temporanea con la nuova struttura
        await db.run(`
            CREATE TABLE IF NOT EXISTS password_info_new (
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
        `);
        
        console.log('✅ Tabella password_info_new creata');
        
        // 2. Recuperiamo i dati esistenti
        const existingData = await db.all('SELECT * FROM password_info');
        console.log(`📊 Trovate ${existingData.length} password esistenti`);
        
        // 3. Migriamo i dati categorizzandoli automaticamente
        for (const row of existingData) {
            let categoria = 'Altro';
            let username = null;
            let email = null;
            let url = null;
            let codici = null;
            
            // Categorizziamo automaticamente in base al titolo
            const titolo = row.titolo.toLowerCase();
            if (titolo.includes('ariston') || titolo.includes('baxi') || titolo.includes('immergas') || 
                titolo.includes('lamborghini') || titolo.includes('haier') || titolo.includes('circe') || 
                titolo.includes('idraco')) {
                categoria = 'Termoidraulica';
            } else if (titolo.includes('gmail') || titolo.includes('mail') || titolo.includes('aruba') || 
                       titolo.includes('pec')) {
                categoria = 'Email';
            } else if (titolo.includes('adobe') || titolo.includes('acca') || titolo.includes('cad') || 
                       titolo.includes('app') || titolo.includes('software')) {
                categoria = 'Software';
            } else if (titolo.includes('agenzia') || titolo.includes('entrate') || titolo.includes('gse') || 
                       titolo.includes('spid') || titolo.includes('infocert') || titolo.includes('enesco')) {
                categoria = 'PA_Fiscale';
            } else if (titolo.includes('amazon') || titolo.includes('ricambi') || titolo.includes('autodoc')) {
                categoria = 'E-commerce';
            } else if (titolo.includes('fastweb') || titolo.includes('voispeed') || titolo.includes('sumup') ||
                       titolo.includes('avelia') || titolo.includes('apple') || titolo.includes('agora')) {
                categoria = 'Servizi_Web';
            } else if (titolo.includes('fausto') || titolo.includes('qcell') || titolo.includes('verdeco') ||
                       titolo.includes('fondotax')) {
                categoria = 'Fornitori';
            }
            
            // Estraiamo informazioni dalla descrizione se presente
            if (row.descrizione) {
                const desc = row.descrizione;
                
                // Cerca email
                const emailMatch = desc.match(/[\w\.-]+@[\w\.-]+\.\w+/);
                if (emailMatch) {
                    email = emailMatch[0];
                }
                
                // Cerca username/user
                const userMatch = desc.match(/(?:user|username|utente):\s*([^\s,]+)/i);
                if (userMatch) {
                    username = userMatch[1];
                }
                
                // Cerca codici
                const codeMatch = desc.match(/(?:codice|pin|code):\s*([^\s,]+)/i);
                if (codeMatch) {
                    codici = codeMatch[1];
                }
                
                // Cerca URL
                const urlMatch = desc.match(/(https?:\/\/[^\s,]+)/);
                if (urlMatch) {
                    url = urlMatch[1];
                }
            }
            
            // Inseriamo nella nuova tabella
            await db.run(`
                INSERT INTO password_info_new (
                    titolo, categoria, url, username, email, passwordCifrata, 
                    codici, descrizione, note, dataInserimento, dataModifica, 
                    utenteCreazione, utenteModifica
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                row.titolo,
                categoria,
                url,
                username,
                email,
                row.valoreCifrato, // Il vecchio campo valoreCifrato diventa passwordCifrata
                codici,
                row.descrizione,
                null, // note vuote per ora
                row.dataInserimento,
                row.dataModifica,
                row.utenteCreazione,
                row.utenteModifica
            ]);
            
            console.log(`✅ Migrata: ${row.titolo} -> Categoria: ${categoria}`);
        }
        
        // 4. Facciamo il backup della vecchia tabella e sostituiamo
        await db.run('ALTER TABLE password_info RENAME TO password_info_backup');
        await db.run('ALTER TABLE password_info_new RENAME TO password_info');
        
        console.log('🔄 Tabelle rinominate');
        
        // 5. Verifichiamo la migrazione
        const newCount = await db.get('SELECT COUNT(*) as count FROM password_info');
        console.log(`📊 Migrazione completata: ${newCount.count} password nella nuova struttura`);
        
        // 6. Mostriamo le categorie
        const categories = await db.all(`
            SELECT categoria, COUNT(*) as count 
            FROM password_info 
            GROUP BY categoria 
            ORDER BY count DESC
        `);
        
        console.log('\n📋 Password per categoria:');
        categories.forEach(cat => {
            console.log(`   ${cat.categoria}: ${cat.count} password`);
        });
        
        console.log('\n🎉 Migrazione completata con successo!');
        
    } catch (error) {
        console.error('❌ Errore durante la migrazione:', error);
        throw error;
    }
}

// Esegui la migrazione
migratePasswordInfo()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 Migrazione fallita:', error);
        process.exit(1);
    });
