const express = require('express');
const db = require('../database');
const { validatePasswordInfo, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/password-info - Lista dati sensibili (solo admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { search = '', page = 1, limit = 1000 } = req.query;

        let whereClause = '';
        let params = [];

        // Ricerca per titolo o descrizione
        if (search) {
            whereClause = 'WHERE titolo LIKE ? OR descrizione LIKE ?';
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
                pi.infoId, pi.titolo, pi.categoria, pi.url, pi.username, 
                pi.email, pi.codici, pi.descrizione, pi.note,
                pi.dataInserimento, pi.dataModifica,
                u1.nome as nomeUtenteCreazione,
                u1.cognome as cognomeUtenteCreazione,
                u2.nome as nomeUtenteModifica,
                u2.cognome as cognomeUtenteModifica,
                '••••••••' as passwordMascherata
            FROM password_info pi
            LEFT JOIN utenti u1 ON pi.utenteCreazione = u1.utenteId
            LEFT JOIN utenti u2 ON pi.utenteModifica = u2.utenteId
            ${whereClause}
            ORDER BY pi.categoria, pi.titolo
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, parseInt(limit), offset];
        const passwordInfo = await db.all(dataSql, dataParams);

        // Calcolo paginazione
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        res.json({
            passwordInfo,
            pagination: {
                current: parseInt(page),
                total: totalPages,
                hasNext,
                hasPrev,
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

// GET /api/password-info/:id - Dettaglio dato sensibile con valore decifrato (solo admin)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const info = await db.get(`
            SELECT 
                pi.*,
                u1.nome as nomeUtenteCreazione,
                u1.cognome as cognomeUtenteCreazione,
                u2.nome as nomeUtenteModifica,
                u2.cognome as cognomeUtenteModifica
            FROM password_info pi
            LEFT JOIN utenti u1 ON pi.utenteCreazione = u1.utenteId
            LEFT JOIN utenti u2 ON pi.utenteModifica = u2.utenteId
            WHERE pi.infoId = ?
        `, [id]);

        if (!info) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'INFO_NOT_FOUND'
            });
        }

        // Decifra la password
        try {
            const passwordDecifrata = db.decrypt(info.passwordCifrata);
            info.password = passwordDecifrata;
            delete info.passwordCifrata; // Rimuovi il valore cifrato dalla risposta
        } catch (decryptError) {
            console.error('Errore decifratura:', decryptError);
            info.password = '[ERRORE DECIFRATURA]';
        }

        // Log dell'accesso
        db.logActivity(
            req.user.utenteId, 
            'VIEW', 
            'password_info', 
            id, 
            `Accesso a dato sensibile: ${info.titolo}`
        );

        res.json({ info });

    } catch (error) {
        console.error('Errore recupero info:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// POST /api/password-info - Nuovo dato sensibile (solo admin)
router.post('/', authenticateToken, requireAdmin, validatePasswordInfo, handleValidationErrors, async (req, res) => {
    try {
        const { 
            titolo, categoria = 'Altro', url, username, email, 
            password, codici, descrizione, note 
        } = req.body;

        // Cifra la password
        const passwordCifrata = db.encrypt(password);

        const result = await db.run(`
            INSERT INTO password_info (
                titolo, categoria, url, username, email, passwordCifrata, 
                codici, descrizione, note, utenteCreazione
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            titolo, categoria, url, username, email, passwordCifrata, 
            codici, descrizione, note, req.user.utenteId
        ]);

        // Log dell'operazione
        db.logActivity(
            req.user.utenteId, 
            'CREATE', 
            'password_info', 
            result.id, 
            `Nuovo dato sensibile: ${titolo} (${categoria})`
        );

        res.status(201).json({
            message: 'Informazione salvata con successo',
            infoId: result.id
        });

    } catch (error) {
        console.error('Errore creazione info:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// PUT /api/password-info/:id - Modifica dato sensibile (solo admin)
router.put('/:id', authenticateToken, requireAdmin, validatePasswordInfo, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            titolo, categoria, url, username, email, 
            password, codici, descrizione, note 
        } = req.body;

        // Verifica esistenza
        const existing = await db.get('SELECT infoId, titolo FROM password_info WHERE infoId = ?', [id]);
        if (!existing) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'INFO_NOT_FOUND'
            });
        }

        // Cifra la nuova password
        const passwordCifrata = db.encrypt(password);

        const result = await db.run(`
            UPDATE password_info 
            SET titolo = ?, categoria = ?, url = ?, username = ?, email = ?, 
                passwordCifrata = ?, codici = ?, descrizione = ?, note = ?,
                utenteModifica = ?, dataModifica = CURRENT_TIMESTAMP
            WHERE infoId = ?
        `, [
            titolo, categoria, url, username, email, passwordCifrata, 
            codici, descrizione, note, req.user.utenteId, id
        ]);

        if (result.changes === 0) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'INFO_NOT_FOUND'
            });
        }

        // Log dell'operazione
        db.logActivity(
            req.user.utenteId, 
            'UPDATE', 
            'password_info', 
            id, 
            `Dato sensibile modificato: ${titolo}`
        );

        res.json({
            message: 'Informazione aggiornata con successo'
        });

    } catch (error) {
        console.error('Errore modifica info:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// DELETE /api/password-info/:id - Elimina dato sensibile (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Recupera info per log
        const info = await db.get('SELECT titolo FROM password_info WHERE infoId = ?', [id]);
        if (!info) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'INFO_NOT_FOUND'
            });
        }

        const result = await db.run('DELETE FROM password_info WHERE infoId = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'INFO_NOT_FOUND'
            });
        }

        // Log dell'operazione
        db.logActivity(
            req.user.utenteId, 
            'DELETE', 
            'password_info', 
            id, 
            `Dato sensibile eliminato: ${info.titolo}`
        );

        res.json({
            message: 'Informazione eliminata con successo'
        });

    } catch (error) {
        console.error('Errore eliminazione info:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// PUT /api/password-info/:id/reveal - Rivela temporaneamente valore (solo admin)
router.put('/:id/reveal', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const info = await db.get(
            'SELECT titolo, passwordCifrata FROM password_info WHERE infoId = ?', 
            [id]
        );

        if (!info) {
            return res.status(404).json({
                error: 'Informazione non trovata',
                code: 'INFO_NOT_FOUND'
            });
        }

        // Decifra la password
        try {
            const passwordDecifrata = db.decrypt(info.passwordCifrata);
            
            // Log dell'accesso
            db.logActivity(
                req.user.utenteId, 
                'REVEAL', 
                'password_info', 
                id, 
                `Password rivelata: ${info.titolo}`
            );

            res.json({
                password: passwordDecifrata
            });

        } catch (decryptError) {
            console.error('Errore decifratura:', decryptError);
            res.status(500).json({
                error: 'Errore nella decifratura della password',
                code: 'DECRYPT_ERROR'
            });
        }

    } catch (error) {
        console.error('Errore reveal:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
