const express = require('express');
const db = require('../database-pg');
const { validateClient, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireAdmin, requireOperatorOrAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/clienti - Lista clienti con ricerca e filtri
router.get('/', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const {
            search = '',
            provenienzaContatto = '',
            consensoMarketing = '',
            page = 1,
            limit = 50,
            sortBy = 'cognome',
            sortOrder = 'ASC'
        } = req.query;

        // Validazione parametri di ordinamento
        const validSortColumns = ['nome', 'cognome', 'email', 'telefono', 'citta', 'dataCreazione', 'provenienzaContatto'];
        const validSortOrders = ['ASC', 'DESC'];
        
        const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'cognome';
        const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        // Costruzione query con filtri
        let whereConditions = [];
        let params = [];

        // Ricerca per nome, cognome, email o telefono
        if (search) {
            whereConditions.push(`(
                nome ILIKE $${params.length + 1} OR 
                cognome ILIKE $${params.length + 2} OR 
                email ILIKE $${params.length + 3} OR 
                telefono ILIKE $${params.length + 4}
            )`);
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        // Filtro per provenienza contatto
        if (provenienzaContatto) {
            whereConditions.push(`provenienzaContatto = $${params.length + 1}`);
            params.push(provenienzaContatto);
        }

        // Filtro per consenso marketing
        if (consensoMarketing !== '') {
            whereConditions.push(`consensoMarketing = $${params.length + 1}`);
            params.push(consensoMarketing === 'true');
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Query per conteggio totale
        const countSql = `SELECT COUNT(*) as total FROM clienti ${whereClause}`;
        const countResult = await db.get(countSql, params);
        const total = countResult.total;

        // Query per dati paginati
        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT 
                clienteId, nome, cognome, email, telefono, 
                indirizzo, citta, cap, provincia, provenienzaContatto,
                consensoPrivacy, consensoMarketing, note,
                dataCreazione, dataModifica
            FROM clienti 
            ${whereClause}
            ORDER BY ${finalSortBy} ${finalSortOrder}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        
        const dataParams = [...params, parseInt(limit), offset];
        const clienti = await db.all(dataSql, dataParams);

        // Calcolo info paginazione
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        res.json({
            clienti,
            pagination: {
                current: parseInt(page),
                total: totalPages,
                hasNext,
                hasPrev,
                totalRecords: total
            },
            filters: {
                search,
                provenienzaContatto,
                consensoMarketing
            }
        });

    } catch (error) {
        console.error('Errore recupero clienti:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// GET /api/clienti/stats - Statistiche clienti
router.get('/stats', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        // Totale clienti
        const totalClienti = await db.get('SELECT COUNT(*) as count FROM clienti');
        
        // Clienti per provenienza
        const provenienzaStats = await db.all(`
            SELECT provenienzaContatto, COUNT(*) as count 
            FROM clienti 
            GROUP BY provenienzaContatto 
            ORDER BY count DESC
        `);

        // Consensi marketing
        const consensoMarketingStats = await db.all(`
            SELECT 
                CASE WHEN consensoMarketing = 1 THEN 'Con consenso' ELSE 'Senza consenso' END as tipo,
                COUNT(*) as count 
            FROM clienti 
            GROUP BY consensoMarketing
        `);

        // Clienti per mese (ultimi 12 mesi)
        const clientiPerMese = await db.all(`
            SELECT 
                strftime('%Y-%m', dataCreazione) as mese,
                COUNT(*) as count
            FROM clienti 
            WHERE dataCreazione >= date('now', '-12 months')
            GROUP BY strftime('%Y-%m', dataCreazione)
            ORDER BY mese
        `);

        res.json({
            totaleClienti: totalClienti.count,
            provenienzaContatto: provenienzaStats,
            consensoMarketing: consensoMarketingStats,
            andamentoMensile: clientiPerMese
        });

    } catch (error) {
        console.error('Errore statistiche clienti:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// GET /api/clienti/:id - Dettaglio cliente
router.get('/:id', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const cliente = await db.get(`
            SELECT 
                c.*,
                u1.nome as nomeUtenteCreazione,
                u1.cognome as cognomeUtenteCreazione,
                u2.nome as nomeUtenteModifica,
                u2.cognome as cognomeUtenteModifica
            FROM clienti c
            LEFT JOIN utenti u1 ON c.utenteCreazione = u1.utenteId
            LEFT JOIN utenti u2 ON c.utenteModifica = u2.utenteId
            WHERE c.clienteId = ?
        `, [id]);

        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        res.json({ cliente });

    } catch (error) {
        console.error('Errore recupero cliente:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// POST /api/clienti - Nuovo cliente
router.post('/', authenticateToken, requireOperatorOrAdmin, validateClient, handleValidationErrors, async (req, res) => {
    try {
        const {
            nome, cognome, email, telefono, indirizzo, citta, cap, provincia,
            provenienzaContatto, consensoPrivacy, consensoMarketing, note
        } = req.body;

        // Verifica email univoca
        const existingClient = await db.get('SELECT email FROM clienti WHERE email = ?', [email]);
        if (existingClient) {
            return res.status(400).json({
                error: 'Email già registrata per un altro cliente',
                code: 'EMAIL_EXISTS'
            });
        }

        // Normalizza telefono
        const telefonoNormalizzato = telefono.startsWith('+39') ? telefono : `+39 ${telefono}`;

        const result = await db.run(`
            INSERT INTO clienti (
                nome, cognome, email, telefono, indirizzo, citta, cap, provincia,
                provenienzaContatto, consensoPrivacy, consensoMarketing, note,
                utenteCreazione, utenteModifica
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nome, cognome, email, telefonoNormalizzato, indirizzo, citta, cap, provincia,
            provenienzaContatto, consensoPrivacy ? 1 : 0, consensoMarketing ? 1 : 0, note,
            req.user.utenteId, req.user.utenteId
        ]);

        // Log dell'operazione
        db.logActivity(
            req.user.utenteId, 
            'CREATE', 
            'clienti', 
            result.id, 
            `Nuovo cliente: ${nome} ${cognome} (${email})`
        );

        res.status(201).json({
            message: 'Cliente creato con successo',
            clienteId: result.id
        });

    } catch (error) {
        console.error('Errore creazione cliente:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// PUT /api/clienti/:id - Modifica cliente
router.put('/:id', authenticateToken, requireOperatorOrAdmin, validateClient, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome, cognome, email, telefono, indirizzo, citta, cap, provincia,
            provenienzaContatto, consensoPrivacy, consensoMarketing, note
        } = req.body;

        // Verifica che il cliente esista
        const existingClient = await db.get('SELECT clienteId, email FROM clienti WHERE clienteId = ?', [id]);
        if (!existingClient) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // Verifica email univoca (escludendo il cliente corrente)
        const emailConflict = await db.get(
            'SELECT clienteId FROM clienti WHERE email = ? AND clienteId != ?', 
            [email, id]
        );
        if (emailConflict) {
            return res.status(400).json({
                error: 'Email già registrata per un altro cliente',
                code: 'EMAIL_EXISTS'
            });
        }

        // Normalizza telefono
        const telefonoNormalizzato = telefono.startsWith('+39') ? telefono : `+39 ${telefono}`;

        const result = await db.run(`
            UPDATE clienti SET
                nome = ?, cognome = ?, email = ?, telefono = ?, 
                indirizzo = ?, citta = ?, cap = ?, provincia = ?,
                provenienzaContatto = ?, consensoPrivacy = ?, consensoMarketing = ?, 
                note = ?, utenteModifica = ?, dataModifica = CURRENT_TIMESTAMP
            WHERE clienteId = ?
        `, [
            nome, cognome, email, telefonoNormalizzato,
            indirizzo, citta, cap, provincia,
            provenienzaContatto, consensoPrivacy ? 1 : 0, consensoMarketing ? 1 : 0,
            note, req.user.utenteId, id
        ]);

        if (result.changes === 0) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // Log dell'operazione
        db.logActivity(
            req.user.utenteId, 
            'UPDATE', 
            'clienti', 
            id, 
            `Cliente modificato: ${nome} ${cognome} (${email})`
        );

        res.json({
            message: 'Cliente aggiornato con successo'
        });

    } catch (error) {
        console.error('Errore modifica cliente:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// DELETE /api/clienti/:id - Elimina cliente (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Recupera dati cliente per log
        const cliente = await db.get(
            'SELECT nome, cognome, email FROM clienti WHERE clienteId = ?', 
            [id]
        );

        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        const result = await db.run('DELETE FROM clienti WHERE clienteId = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // Log dell'operazione
        db.logActivity(
            req.user.utenteId, 
            'DELETE', 
            'clienti', 
            id, 
            `Cliente eliminato: ${cliente.nome} ${cliente.cognome} (${cliente.email})`
        );

        res.json({
            message: 'Cliente eliminato con successo'
        });

    } catch (error) {
        console.error('Errore eliminazione cliente:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
