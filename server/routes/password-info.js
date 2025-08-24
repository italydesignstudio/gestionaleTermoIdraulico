const express = require('express');
const db = require('../database-pg');
const { validatePasswordInfo, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireAdmin, requireOperatorOrAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/password-info - Lista dati sensibili (operatori e admin)
router.get('/', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { search = '', page = 1, limit = 1000 } = req.query;

        let whereClause = '';
        let params = [];

        // Ricerca per titolo o descrizione
        if (search) {
            whereClause = 'WHERE titolo ILIKE $1 OR descrizione ILIKE $2';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern);
        }

        // Conteggio totale
        const countSql = `SELECT COUNT(*) as total FROM password_info ${whereClause}`;
        const countResult = await db.get(countSql, params);
        const total = countResult.total;

        // Dati paginati (senza password decifrata per sicurezza nella lista)
        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT 
                pi.infoid as "infoId", 
                pi.titolo, 
                pi.categoria, 
                pi.url, 
                pi.username, 
                pi.email, 
                pi.codici, 
                pi.descrizione, 
                pi.note,
                pi.datainserimento as "dataInserimento", 
                pi.datamodifica as "dataModifica",
                u1.nome as "nomeUtenteCreazione",
                u1.cognome as "cognomeUtenteCreazione",
                u2.nome as "nomeUtenteModifica",
                u2.cognome as "cognomeUtenteModifica",
                '••••••••' as "passwordMascherata"
            FROM password_info pi
            LEFT JOIN utenti u1 ON pi.utentecreazione = u1.utenteid
            LEFT JOIN utenti u2 ON pi.utentemodifica = u2.utenteid
            ${whereClause}
            ORDER BY pi.categoria, pi.titolo
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        const dataParams = [...params, parseInt(limit), offset];
        const passwordInfo = await db.all(dataSql, dataParams);

        // Calcolo paginazione
        const totalPages = Math.ceil(total / limit);

        res.json({
            passwordInfo,
            pagination: {
                current: parseInt(page),
                total: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                limit: parseInt(limit),
                totalRecords: total
            }
        });

    } catch (error) {
        console.error('Errore recupero password info:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// GET /api/password-info/stats - Statistiche per categoria
router.get('/stats', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        // Conteggio per categoria
        const categoriaStats = await db.all(`
            SELECT categoria, COUNT(*) as count 
            FROM password_info 
            GROUP BY categoria 
            ORDER BY count DESC
        `);

        // Totale record
        const totalResult = await db.get('SELECT COUNT(*) as total FROM password_info');

        res.json({
            total: totalResult.total,
            categoriaStats
        });

    } catch (error) {
        console.error('Errore statistiche password info:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// GET /api/password-info/:id - Dettaglio con password decifrata (operatori e admin)
router.get('/:id', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const passwordInfo = await db.get(`
            SELECT 
                pi.infoid as "infoId",
                pi.titolo,
                pi.categoria,
                pi.url,
                pi.username,
                pi.email,
                pi.passwordcifrata,
                pi.codici,
                pi.descrizione,
                pi.note,
                pi.datainserimento as "dataInserimento",
                pi.datamodifica as "dataModifica",
                pi.utentecreazione as "utenteCreazione",
                pi.utentemodifica as "utenteModifica",
                u1.nome as "nomeUtenteCreazione",
                u1.cognome as "cognomeUtenteCreazione",
                u2.nome as "nomeUtenteModifica",
                u2.cognome as "cognomeUtenteModifica"
            FROM password_info pi
            LEFT JOIN utenti u1 ON pi.utentecreazione = u1.utenteid
            LEFT JOIN utenti u2 ON pi.utentemodifica = u2.utenteid
            WHERE pi.infoid = $1
        `, [id]);

        if (!passwordInfo) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'PASSWORD_INFO_NOT_FOUND'
            });
        }

        // Decifra la password solo quando richiesta esplicitamente
        try {
            passwordInfo.password = db.decrypt(passwordInfo.passwordcifrata);
        } catch (error) {
            console.error('Errore decifratura password:', error);
            passwordInfo.password = 'Errore decifratura';
        }

        // Rimuovi la password cifrata dal risultato
        delete passwordInfo.passwordcifrata;

        // Log dell'accesso ai dati sensibili
        db.logActivity(req.user.utenteId, 'VIEW', 'password_info', id, `Visualizzazione dati sensibili: ${passwordInfo.titolo}`);

        res.json({
            info: passwordInfo
        });

    } catch (error) {
        console.error('Errore recupero password info:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// POST /api/password-info - Nuovo record dati sensibili (operatori e admin)
router.post('/', authenticateToken, requireOperatorOrAdmin, validatePasswordInfo, handleValidationErrors, async (req, res) => {
    try {
        const {
            titolo, categoria, url, username, email, password, codici, descrizione, note
        } = req.body;

        // Cifra la password
        const passwordCifrata = db.encrypt(password);

        // Inserisci nuovo record
        const result = await db.query(`
            INSERT INTO password_info (
                titolo, categoria, url, username, email, passwordCifrata, 
                codici, descrizione, note, utenteCreazione, utenteModifica
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING infoId
        `, [
            titolo, categoria, url, username, email, passwordCifrata,
            codici, descrizione, note, req.user.utenteId, req.user.utenteId
        ]);

        const infoId = result.rows[0].infoid;

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'CREATE', 'password_info', infoId, `Nuovi dati sensibili creati: ${titolo}`);

        res.status(201).json({
            message: 'Dati sensibili creati con successo',
            infoId,
            passwordInfo: {
                infoId,
                titolo, categoria, url, username, email,
                codici, descrizione, note
                // Password non inclusa nella risposta per sicurezza
            }
        });

    } catch (error) {
        console.error('Errore creazione password info:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// PUT /api/password-info/:id - Modifica dati sensibili (operatori e admin)
router.put('/:id', authenticateToken, requireOperatorOrAdmin, validatePasswordInfo, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            titolo, categoria, url, username, email, password, codici, descrizione, note
        } = req.body;

        // Verifica se record esiste
        const existingRecord = await db.get('SELECT infoid FROM password_info WHERE infoid = $1', [id]);
        if (!existingRecord) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'PASSWORD_INFO_NOT_FOUND'
            });
        }

        // Cifra la nuova password
        const passwordCifrata = db.encrypt(password);

        // Aggiorna record
        const result = await db.query(`
            UPDATE password_info SET 
                titolo = $1, categoria = $2, url = $3, username = $4, email = $5,
                passwordCifrata = $6, codici = $7, descrizione = $8, note = $9,
                dataModifica = NOW(), utenteModifica = $10
            WHERE infoid = $11
        `, [
            titolo, categoria, url, username, email, passwordCifrata,
            codici, descrizione, note, req.user.utenteId, id
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'PASSWORD_INFO_NOT_FOUND'
            });
        }

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'UPDATE', 'password_info', id, `Dati sensibili modificati: ${titolo}`);

        res.json({
            message: 'Dati sensibili aggiornati con successo',
            passwordInfo: {
                infoId: parseInt(id),
                titolo, categoria, url, username, email,
                codici, descrizione, note
                // Password non inclusa nella risposta per sicurezza
            }
        });

    } catch (error) {
        console.error('Errore modifica password info:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// DELETE /api/password-info/:id - Elimina dati sensibili (operatori e admin)
router.delete('/:id', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Recupera info per il log prima dell'eliminazione
        const existingRecord = await db.get('SELECT titolo FROM password_info WHERE infoid = $1', [id]);
        if (!existingRecord) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'PASSWORD_INFO_NOT_FOUND'
            });
        }

        // Elimina record
        const result = await db.query('DELETE FROM password_info WHERE infoid = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'PASSWORD_INFO_NOT_FOUND'
            });
        }

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'DELETE', 'password_info', id, 
            `Dati sensibili eliminati: ${existingRecord.titolo}`);

        res.json({
            message: 'Dati sensibili eliminati con successo'
        });

    } catch (error) {
        console.error('Errore eliminazione password info:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// PUT /api/password-info/:id/reveal - Rivela password (operatori e admin)
router.put('/:id/reveal', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const passwordInfo = await db.get(`
            SELECT infoid as "infoId", titolo, passwordcifrata
            FROM password_info 
            WHERE infoid = $1
        `, [id]);

        if (!passwordInfo) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'PASSWORD_INFO_NOT_FOUND'
            });
        }

        // Decifra la password
        let passwordDecifrata;
        try {
            passwordDecifrata = db.decrypt(passwordInfo.passwordcifrata);
        } catch (error) {
            console.error('Errore decifratura password:', error);
            return res.status(500).json({
                error: 'Errore nella decifratura della password',
                code: 'DECRYPTION_ERROR'
            });
        }

        // Log dell'accesso per sicurezza
        db.logActivity(req.user.utenteId, 'REVEAL', 'password_info', id, `Password rivelata per: ${passwordInfo.titolo}`);

        res.json({
            password: passwordDecifrata
        });

    } catch (error) {
        console.error('Errore reveal password:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// POST /api/password-info/import-csv - Importa CSV (solo admin)
router.post('/import-csv', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { csvData } = req.body;

        if (!csvData || !Array.isArray(csvData)) {
            return res.status(400).json({
                error: 'Dati CSV non validi',
                code: 'INVALID_CSV_DATA'
            });
        }

        let importedCount = 0;
        let errors = [];

        for (const row of csvData) {
            try {
                const {
                    titolo, categoria = 'Altro', url, username, email, password,
                    codici, descrizione, note
                } = row;

                if (!titolo || !password) {
                    errors.push(`Riga ignorata - titolo o password mancanti: ${JSON.stringify(row)}`);
                    continue;
                }

                const passwordCifrata = db.encrypt(password);

                await db.query(`
                    INSERT INTO password_info (
                        titolo, categoria, url, username, email, passwordCifrata,
                        codici, descrizione, note, utenteCreazione, utenteModifica
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [
                    titolo, categoria, url, username, email, passwordCifrata,
                    codici, descrizione, note, req.user.utenteId, req.user.utenteId
                ]);

                importedCount++;

            } catch (error) {
                errors.push(`Errore importazione riga: ${error.message}`);
            }
        }

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'IMPORT', 'password_info', null, 
            `Importazione CSV completata: ${importedCount} record importati, ${errors.length} errori`);

        res.json({
            message: 'Importazione completata',
            imported: importedCount,
            errors: errors.length,
            errorDetails: errors
        });

    } catch (error) {
        console.error('Errore importazione CSV:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
