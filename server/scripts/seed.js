const bcrypt = require('bcryptjs');
const db = require('../database');

const seedData = async () => {
    try {
        console.log('🌱 Inizializzazione dati di test...');

        // Utenti di test
        const hashedPassword = await bcrypt.hash('password123', 12);
        
        await db.run(`
            INSERT OR REPLACE INTO utenti (utenteId, nome, cognome, email, password, ruolo)
            VALUES 
                (1, 'Mario', 'Rossi', 'admin@termoidraulico.it', ?, 'Amministratore'),
                (2, 'Giulia', 'Bianchi', 'operatore@termoidraulico.it', ?, 'Operatore')
        `, [hashedPassword, hashedPassword]);

        console.log('✅ Utenti di test creati');

        // Clienti di test
        const clientiTest = [
            {
                nome: 'Marco', cognome: 'Verdi', email: 'marco.verdi@email.it', 
                telefono: '+39 345 678 9012', indirizzo: 'Via Roma 123', 
                citta: 'Milano', cap: '20100', provincia: 'MI',
                provenienzaContatto: 'Google', consensoPrivacy: 1, consensoMarketing: 1,
                note: 'Cliente interessato a caldaia a condensazione'
            },
            {
                nome: 'Anna', cognome: 'Neri', email: 'anna.neri@email.it',
                telefono: '+39 333 456 7890', indirizzo: 'Via Dante 45',
                citta: 'Roma', cap: '00100', provincia: 'RM',
                provenienzaContatto: 'Passaparola', consensoPrivacy: 1, consensoMarketing: 0,
                note: 'Richiesta preventivo per rifacimento bagno'
            },
            {
                nome: 'Luigi', cognome: 'Ferrari', email: 'luigi.ferrari@email.it',
                telefono: '+39 340 123 4567', indirizzo: 'Corso Italia 67',
                citta: 'Napoli', cap: '80100', provincia: 'NA',
                provenienzaContatto: 'Facebook', consensoPrivacy: 1, consensoMarketing: 1,
                note: 'Installazione pompa di calore'
            },
            {
                nome: 'Sara', cognome: 'Blu', email: 'sara.blu@email.it',
                telefono: '+39 389 234 5678', indirizzo: 'Via Garibaldi 89',
                citta: 'Torino', cap: '10100', provincia: 'TO',
                provenienzaContatto: 'Sito web', consensoPrivacy: 1, consensoMarketing: 1,
                note: 'Sostituzione termosifoni'
            },
            {
                nome: 'Paolo', cognome: 'Gialli', email: 'paolo.gialli@email.it',
                telefono: '+39 347 345 6789', indirizzo: 'Via Mazzini 12',
                citta: 'Firenze', cap: '50100', provincia: 'FI',
                provenienzaContatto: 'Volantino', consensoPrivacy: 1, consensoMarketing: 0,
                note: 'Manutenzione caldaia annuale'
            },
            {
                nome: 'Elena', cognome: 'Rosa', email: 'elena.rosa@email.it',
                telefono: '+39 366 456 7890', indirizzo: 'Via Venezia 34',
                citta: 'Bologna', cap: '40100', provincia: 'BO',
                provenienzaContatto: 'Instagram', consensoPrivacy: 1, consensoMarketing: 1,
                note: 'Nuovo impianto idraulico casa'
            },
            {
                nome: 'Roberto', cognome: 'Viola', email: 'roberto.viola@email.it',
                telefono: '+39 320 567 8901', indirizzo: 'Via Torino 56',
                citta: 'Genova', cap: '16100', provincia: 'GE',
                provenienzaContatto: 'Cliente esistente', consensoPrivacy: 1, consensoMarketing: 1,
                note: 'Riparazione perdita tubature'
            },
            {
                nome: 'Chiara', cognome: 'Arancio', email: 'chiara.arancio@email.it',
                telefono: '+39 335 678 9012', indirizzo: 'Via Milano 78',
                citta: 'Palermo', cap: '90100', provincia: 'PA',
                provenienzaContatto: 'Google', consensoPrivacy: 1, consensoMarketing: 0,
                note: 'Installazione scaldabagno elettrico'
            },
            {
                nome: 'Andrea', cognome: 'Marrone', email: 'andrea.marrone@email.it',
                telefono: '+39 349 789 0123', indirizzo: 'Via Napoli 90',
                citta: 'Bari', cap: '70100', provincia: 'BA',
                provenienzaContatto: 'Radio', consensoPrivacy: 1, consensoMarketing: 1,
                note: 'Preventivo ristrutturazione bagno completa'
            },
            {
                nome: 'Francesca', cognome: 'Celeste', email: 'francesca.celeste@email.it',
                telefono: '+39 338 890 1234', indirizzo: 'Via Palermo 23',
                citta: 'Catania', cap: '95100', provincia: 'CT',
                provenienzaContatto: 'Passaparola', consensoPrivacy: 1, consensoMarketing: 1,
                note: 'Controllo efficienza energetica'
            },
            {
                nome: 'Stefano', cognome: 'Oro', email: 'stefano.oro@email.it',
                telefono: '+39 377 901 2345', indirizzo: 'Via Bari 45',
                citta: 'Venezia', cap: '30100', provincia: 'VE',
                provenienzaContatto: 'TV', consensoPrivacy: 1, consensoMarketing: 0,
                note: 'Installazione sistema domotico riscaldamento'
            },
            {
                nome: 'Valentina', cognome: 'Argento', email: 'valentina.argento@email.it',
                telefono: '+39 363 012 3456', indirizzo: 'Via Firenze 67',
                citta: 'Verona', cap: '37100', provincia: 'VR',
                provenienzaContatto: 'Giornale', consensoPrivacy: 1, consensoMarketing: 1,
                note: 'Sostituzione caldaia obsoleta'
            }
        ];

        for (const cliente of clientiTest) {
            try {
                await db.run(`
                    INSERT INTO clienti (
                        nome, cognome, email, telefono, indirizzo, citta, cap, provincia,
                        provenienzaContatto, consensoPrivacy, consensoMarketing, note,
                        utenteCreazione, utenteModifica
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    cliente.nome, cliente.cognome, cliente.email, cliente.telefono,
                    cliente.indirizzo, cliente.citta, cliente.cap, cliente.provincia,
                    cliente.provenienzaContatto, cliente.consensoPrivacy, cliente.consensoMarketing,
                    cliente.note, 1, 1
                ]);
            } catch (error) {
                console.log(`⚠️ Cliente ${cliente.email} già esistente`);
            }
        }

        console.log('✅ Clienti di test creati');

        // Dati sensibili di test (solo per admin)
        const passwordInfoTest = [
            {
                titolo: 'Accesso Router Ufficio',
                descrizione: 'Credenziali per accesso al router principale',
                valore: 'admin / SuperPassword2024!'
            },
            {
                titolo: 'Database Backup',
                descrizione: 'Password per backup automatico database',
                valore: 'BackupUser123$'
            },
            {
                titolo: 'Codice Allarme',
                descrizione: 'Codice di sicurezza per sistema allarme sede',
                valore: '1234*5678#'
            },
            {
                titolo: 'Account Social Media',
                descrizione: 'Password account Facebook aziendale',
                valore: 'SocialMedia2024!'
            },
            {
                titolo: 'Cassaforte Ufficio',
                descrizione: 'Combinazione cassaforte documenti importanti',
                valore: '15-22-08-33'
            }
        ];

        for (const info of passwordInfoTest) {
            try {
                const valoreCifrato = db.encrypt(info.valore);
                await db.run(`
                    INSERT INTO password_info (titolo, descrizione, valoreCifrato, utenteCreazione)
                    VALUES (?, ?, ?, ?)
                `, [info.titolo, info.descrizione, valoreCifrato, 1]);
            } catch (error) {
                console.log(`⚠️ Info ${info.titolo} già esistente`);
            }
        }

        console.log('✅ Dati sensibili di test creati');

        // Log attività iniziali
        await db.run(`
            INSERT INTO log_attivita (utenteId, azione, tabella, dettagli)
            VALUES (1, 'SEED_DATA', 'sistema', 'Dati di test inizializzati')
        `);

        console.log(`
🎉 Inizializzazione completata!

👥 Utenti di prova:
   📧 admin@termoidraulico.it / password123 (Amministratore)
   📧 operatore@termoidraulico.it / password123 (Operatore)

📊 Dati creati:
   👥 2 utenti
   👨‍👩‍👧‍👦 ${clientiTest.length} clienti
   🔐 ${passwordInfoTest.length} informazioni sensibili
   📝 Log attività inizializzato

🚀 Ora puoi avviare il server con: npm run dev
        `);

    } catch (error) {
        console.error('❌ Errore durante l\'inizializzazione:', error);
        process.exit(1);
    }
};

// Esegui seed se chiamato direttamente
if (require.main === module) {
    seedData().then(() => {
        process.exit(0);
    });
}

module.exports = seedData;
