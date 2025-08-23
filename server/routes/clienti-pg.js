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
                clienteId as "clienteId", nome, cognome, email, telefono, 
                indirizzo, citta, cap, provincia, provenienzaContatto as "provenienzaContatto",
                consensoPrivacy as "consensoPrivacy", consensoMarketing as "consensoMarketing", note,
                dataCreazione as "dataCreazione", dataModifica as "dataModifica"
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
                limit: parseInt(limit),
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
        // Conteggio totale clienti
        const totalResult = await db.get('SELECT COUNT(*) as total FROM clienti');
        const totaleClienti = parseInt(totalResult.total);

        // Conteggio per provenienza contatto
        const provenienzaContatto = await db.all(`
            SELECT provenienzaContatto, COUNT(*) as count 
            FROM clienti 
            GROUP BY provenienzaContatto 
            ORDER BY count DESC
        `);

        // Conteggio consensi marketing (convertire boolean in stringa)
        const consensoMarketingRaw = await db.all(`
            SELECT 
                consensoMarketing,
                COUNT(*) as count 
            FROM clienti 
            GROUP BY consensoMarketing
        `);

        const consensoMarketing = consensoMarketingRaw.map(item => ({
            tipo: item.consensomarketing ? 'Con consenso' : 'Senza consenso',
            count: parseInt(item.count)
        }));

        // Andamento mensile (ultimi 12 mesi)
        const andamentoMensile = await db.all(`
            SELECT 
                TO_CHAR(dataCreazione, 'YYYY-MM') as mese,
                COUNT(*) as count
            FROM clienti 
            WHERE dataCreazione >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(dataCreazione, 'YYYY-MM')
            ORDER BY mese DESC
        `);

        res.json({
            totaleClienti,
            provenienzaContatto: provenienzaContatto.map(item => ({
                provenienzaContatto: item.provenienzacontatto,
                count: parseInt(item.count)
            })),
            consensoMarketing,
            andamentoMensile: andamentoMensile.map(item => ({
                mese: item.mese,
                count: parseInt(item.count)
            }))
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
                c.clienteId as "clienteId",
                c.nome, c.cognome, c.email, c.telefono,
                c.indirizzo, c.citta, c.cap, c.provincia,
                c.provenienzaContatto as "provenienzaContatto",
                c.consensoPrivacy as "consensoPrivacy",
                c.consensoMarketing as "consensoMarketing",
                c.note,
                c.dataCreazione as "dataCreazione",
                c.dataModifica as "dataModifica",
                c.utenteCreazione as "utenteCreazione",
                c.utenteModifica as "utenteModifica",
                uc.nome as "nomeUtenteCreazione",
                uc.cognome as "cognomeUtenteCreazione",
                um.nome as "nomeUtenteModifica",
                um.cognome as "cognomeUtenteModifica"
            FROM clienti c
            LEFT JOIN utenti uc ON c.utenteCreazione = uc.utenteId
            LEFT JOIN utenti um ON c.utenteModifica = um.utenteId
            WHERE c.clienteId = $1
        `, [id]);

        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        res.json({
            cliente
        });

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

        // Verifica se email già esistente
        const existingClient = await db.get('SELECT email FROM clienti WHERE email = $1', [email]);
        if (existingClient) {
            return res.status(400).json({
                error: 'Email già registrata per un altro cliente',
                code: 'EMAIL_EXISTS'
            });
        }

        // Normalizza telefono
        const telefonoNormalizzato = telefono.startsWith('+39') ? telefono : `+39 ${telefono}`;

        // Inserisci nuovo cliente
        const result = await db.query(`
            INSERT INTO clienti (
                nome, cognome, email, telefono, indirizzo, citta, cap, provincia,
                provenienzaContatto, consensoPrivacy, consensoMarketing, note,
                utenteCreazione, utenteModifica
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING clienteId
        `, [
            nome, cognome, email, telefonoNormalizzato, indirizzo, citta, cap, provincia,
            provenienzaContatto, consensoPrivacy, consensoMarketing, note,
            req.user.utenteId, req.user.utenteId
        ]);

        const clienteId = result.rows[0].clienteid;

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'CREATE', 'clienti', clienteId, `Nuovo cliente creato: ${nome} ${cognome}`);

        res.status(201).json({
            message: 'Cliente creato con successo',
            clienteId,
            cliente: {
                clienteId,
                nome, cognome, email, telefono: telefonoNormalizzato,
                indirizzo, citta, cap, provincia,
                provenienzaContatto, consensoPrivacy, consensoMarketing, note
            }
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

        // Verifica se cliente esiste
        const existingClient = await db.get('SELECT clienteId, email FROM clienti WHERE clienteId = $1', [id]);
        if (!existingClient) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // Verifica se email già usata da altro cliente
        const emailClient = await db.get(
            'SELECT clienteId FROM clienti WHERE email = $1 AND clienteId != $2', 
            [email, id]
        );
        if (emailClient) {
            return res.status(400).json({
                error: 'Email già registrata per un altro cliente',
                code: 'EMAIL_EXISTS'
            });
        }

        // Normalizza telefono
        const telefonoNormalizzato = telefono.startsWith('+39') ? telefono : `+39 ${telefono}`;

        // Aggiorna cliente
        const result = await db.query(`
            UPDATE clienti SET 
                nome = $1, cognome = $2, email = $3, telefono = $4, 
                indirizzo = $5, citta = $6, cap = $7, provincia = $8,
                provenienzaContatto = $9, consensoPrivacy = $10, consensoMarketing = $11,
                note = $12, dataModifica = NOW(), utenteModifica = $13
            WHERE clienteId = $14
        `, [
            nome, cognome, email, telefonoNormalizzato, indirizzo, citta, cap, provincia,
            provenienzaContatto, consensoPrivacy, consensoMarketing, note,
            req.user.utenteId, id
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'UPDATE', 'clienti', id, `Cliente modificato: ${nome} ${cognome}`);

        res.json({
            message: 'Cliente aggiornato con successo',
            cliente: {
                clienteId: parseInt(id),
                nome, cognome, email, telefono: telefonoNormalizzato,
                indirizzo, citta, cap, provincia,
                provenienzaContatto, consensoPrivacy, consensoMarketing, note
            }
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

        // Verifica se cliente esiste
        const existingClient = await db.get('SELECT clienteId, nome, cognome FROM clienti WHERE clienteId = $1', [id]);
        if (!existingClient) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // Elimina cliente
        const result = await db.query('DELETE FROM clienti WHERE clienteId = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'DELETE', 'clienti', id, 
            `Cliente eliminato: ${existingClient.nome} ${existingClient.cognome}`);

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
