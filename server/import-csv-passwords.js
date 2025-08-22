const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Funzioni di crittografia (copiato da database.js)
function encrypt(text) {
    if (!text || text.trim() === '') return 'EMPTY_PASSWORD'; // Gestisci password vuote
    
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'your_32_char_encryption_key_123456', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
}

function normalizeCategory(categoria) {
    const categoryMap = {
        'Servizi_Web': 'Servizi_Web',
        'Fornitori': 'Fornitori',
        'Email': 'Email',
        'Altro': 'Altro',
        'PA_Fiscale': 'PA_Fiscale',
        'E-commerce': 'E-commerce',
        'Bancario': 'Bancario',
        'Software': 'Software'
    };
    
    return categoryMap[categoria] || 'Altro';
}

async function importCsvPasswords() {
    try {
        // Connetti al database
        const db = new sqlite3.Database('./database.db');
        
        // Promisify le query
        const dbGet = (query, params = []) => {
            return new Promise((resolve, reject) => {
                db.get(query, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        };
        
        const dbAll = (query, params = []) => {
            return new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        };
        
        const dbRun = (query, params = []) => {
            return new Promise((resolve, reject) => {
                db.run(query, params, function(err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
        };
        
        // Leggi le password esistenti per evitare duplicati
        const existingPasswords = await dbAll(`
            SELECT titolo, email, username 
            FROM password_info
        `);
        
        console.log(`Password esistenti nel database: ${existingPasswords.length}`);
        
        const existingSet = new Set();
        existingPasswords.forEach(p => {
            // Creo una chiave unica basata su titolo, email e username
            const key = `${p.titolo.toLowerCase()}_${(p.email || '').toLowerCase()}_${(p.username || '').toLowerCase()}`;
            existingSet.add(key);
        });
        
        // Leggi il CSV
        const csvPath = '/Users/jas/Downloads/merged_passwords.csv';
        const newPasswords = [];
        
        return new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    // Il parser CSV usa _0, _1, ecc. invece dei nomi delle colonne
                    const titolo = row._0 || row.titolo;
                    const categoria = row._1 || row.categoria;
                    const url = row._2 || row.url;
                    const username = row._3 || row.username;
                    const email = row._4 || row.email;
                    const password = row._5 || row.password;
                    const codici = row._6 || row.codici;
                    const descrizione = row._7 || row.descrizione;
                    const note = row._8 || row.note;
                    
                    // Verifica che il titolo esista e non sia vuoto, e che non sia l'header
                    if (!titolo || titolo.trim() === '' || titolo === 'titolo') {
                        console.log('Saltata riga header o senza titolo');
                        return;
                    }
                    
                    // Crea la chiave unica per questo record
                    const key = `${titolo.toLowerCase()}_${(email || '').toLowerCase()}_${(username || '').toLowerCase()}`;
                    
                    // Se non esiste già, aggiungilo alla lista
                    if (!existingSet.has(key)) {
                        newPasswords.push({
                            titolo: titolo.trim(),
                            categoria: normalizeCategory(categoria),
                            url: url && url.trim() !== '' ? url.trim() : null,
                            username: username && username.trim() !== '' ? username.trim() : null,
                            email: email && email.trim() !== '' ? email.trim() : null,
                            password: password && password.trim() !== '' ? password.trim() : null,
                            codici: codici && codici.trim() !== '' ? codici.trim() : null,
                            descrizione: descrizione && descrizione.trim() !== '' ? descrizione.trim() : null,
                            note: note && note.trim() !== '' ? note.trim() : null
                        });
                        console.log(`Aggiunta password: ${titolo}`);
                    } else {
                        console.log('Password già esistente, saltata:', titolo);
                    }
                })
                .on('end', async () => {
                    console.log(`Nuove password da importare: ${newPasswords.length}`);
                    
                    if (newPasswords.length === 0) {
                        console.log('Nessuna nuova password da importare.');
                        db.close();
                        resolve();
                        return;
                    }
                    
                    // Inserisci le nuove password
                    let inserted = 0;
                    for (const pwd of newPasswords) {
                        try {
                            // Sempre cripta qualcosa, anche se è vuoto
                            const encryptedPassword = encrypt(pwd.password || 'NO_PASSWORD');
                            
                            await dbRun(`
                                INSERT INTO password_info (
                                    titolo, categoria, url, username, email, 
                                    passwordCifrata, codici, descrizione, note, 
                                    dataInserimento, utenteCreazione
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
                            `, [
                                pwd.titolo,
                                pwd.categoria,
                                pwd.url,
                                pwd.username,
                                pwd.email,
                                encryptedPassword,
                                pwd.codici,
                                pwd.descrizione,
                                pwd.note,
                                1 // Utente admin come creatore
                            ]);
                            
                            inserted++;
                            console.log(`✓ Inserita: ${pwd.titolo}`);
                        } catch (error) {
                            console.error(`✗ Errore inserimento password "${pwd.titolo}":`, error.message);
                        }
                    }
                    
                    console.log(`Password inserite con successo: ${inserted}`);
                    
                    // Mostra il totale finale
                    const totalAfter = await dbGet('SELECT COUNT(*) as count FROM password_info');
                    console.log(`Totale password nel database: ${totalAfter.count}`);
                    
                    db.close();
                    resolve();
                })
                .on('error', reject);
        });
        
    } catch (error) {
        console.error('Errore durante l\'importazione:', error);
        throw error;
    }
}

// Avvia l'importazione
importCsvPasswords()
    .then(() => {
        console.log('Importazione completata!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Errore:', error);
        process.exit(1);
    });
