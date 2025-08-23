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
        const validSortColumns = ['nome', 'cognome', 'codiceFiscale', 'email', 'telefono', 'citta', 'dataCreazione', 'provenienzaContatto'];
        const validSortOrders = ['ASC', 'DESC'];
        
        const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'cognome';
        const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        // Costruzione query con filtri
        let whereConditions = [];
        let params = [];

        // Ricerca per nome, cognome, codice fiscale, email o telefono
        if (search) {
            whereConditions.push(`(
                nome ILIKE $${params.length + 1} OR
                cognome ILIKE $${params.length + 2} OR
                codiceFiscale ILIKE $${params.length + 3} OR
                email ILIKE $${params.length + 4} OR
                telefono ILIKE $${params.length + 5}
            )`);
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
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
                clienteId, nome, cognome, codiceFiscale AS "codiceFiscale", email, telefono,
                indirizzo, citta, cap, provincia, provenienzaContatto,
                consensoPrivacy AS "consensoPrivacy", consensoMarketing AS "consensoMarketing", note,
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
                c.clienteId,
                c.nome,
                c.cognome,
                c.codiceFiscale AS "codiceFiscale",
                c.email,
                c.telefono,
                c.indirizzo,
                c.citta,
                c.cap,
                c.provincia,
                c.provenienzaContatto,
                c.consensoPrivacy AS "consensoPrivacy",
                c.consensoMarketing AS "consensoMarketing",
                c.note,
                c.dataCreazione,
                c.dataModifica,
                c.utenteCreazione,
                c.utenteModifica,
                uc.nome as nomeUtenteCreazione,
                uc.cognome as cognomeUtenteCreazione,
                um.nome as nomeUtenteModifica,
                um.cognome as cognomeUtenteModifica
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
        console.log('Dati ricevuti per nuovo cliente:', JSON.stringify(req.body, null, 2));
        
        const {
            nome, cognome, codiceFiscale, email, telefono, indirizzo, citta, cap, provincia,
            provenienzaContatto, consensoPrivacy, consensoMarketing = false, note
        } = req.body;

        // Converte stringhe vuote in NULL per controlli
        const codiceFiscaleNormalizzato = codiceFiscale && codiceFiscale.trim() !== '' ? codiceFiscale : null;
        const emailNormalizzata = email && email.trim() !== '' ? email : null;

        // Verifica codice fiscale esistente (solo se fornito)
        if (codiceFiscaleNormalizzato) {
            const existingCf = await db.get('SELECT codiceFiscale FROM clienti WHERE codiceFiscale = $1', [codiceFiscaleNormalizzato]);
            if (existingCf) {
                return res.status(400).json({
                    error: 'Codice fiscale già registrato per un altro cliente',
                    code: 'CODICEFISCALE_EXISTS'
                });
            }
        }

        // Verifica se email già esistente
        if (emailNormalizzata) {
            const existingClient = await db.get('SELECT email FROM clienti WHERE email = $1', [emailNormalizzata]);
            if (existingClient) {
                return res.status(400).json({
                    error: 'Email già registrata per un altro cliente',
                    code: 'EMAIL_EXISTS'
                });
            }
        }

        // Normalizza telefono
        const telefonoNormalizzato = telefono.startsWith('+39') ? telefono : `+39 ${telefono}`;

        // Converte stringhe vuote in NULL per campi opzionali
        const capNormalizzato = cap && cap.trim() !== '' ? cap : null;
        const provinciaNormalizzata = provincia && provincia.trim() !== '' ? provincia : null;

        // Inserisci nuovo cliente
        const result = await db.query(`
            INSERT INTO clienti (
                nome, cognome, codiceFiscale, email, telefono, indirizzo, citta, cap, provincia,
                provenienzaContatto, consensoPrivacy, consensoMarketing, note,
                utenteCreazione, utenteModifica
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING clienteId
        `, [
            nome, cognome, codiceFiscaleNormalizzato, emailNormalizzata, telefonoNormalizzato, indirizzo, citta, capNormalizzato, provinciaNormalizzata,
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
                nome, cognome, codiceFiscale, email, telefono: telefonoNormalizzato,
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
            nome, cognome, codiceFiscale, email, telefono, indirizzo, citta, cap, provincia,
            provenienzaContatto, consensoPrivacy, consensoMarketing = false, note
        } = req.body;

        // Verifica se cliente esiste
        const existingClient = await db.get('SELECT clienteId, email, codiceFiscale FROM clienti WHERE clienteId = $1', [id]);
        if (!existingClient) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // Converte stringhe vuote in NULL per controlli
        const codiceFiscaleNormalizzato = codiceFiscale && codiceFiscale.trim() !== '' ? codiceFiscale : null;
        const emailNormalizzata = email && email.trim() !== '' ? email : null;

        // Verifica se codice fiscale già usato da altro cliente (solo se fornito)
        if (codiceFiscaleNormalizzato) {
            const cfClient = await db.get(
                'SELECT clienteId FROM clienti WHERE codiceFiscale = $1 AND clienteId != $2',
                [codiceFiscaleNormalizzato, id]
            );
            if (cfClient) {
                return res.status(400).json({
                    error: 'Codice fiscale già registrato per un altro cliente',
                    code: 'CODICEFISCALE_EXISTS'
                });
            }
        }

        // Verifica se email già usata da altro cliente
        if (email) {
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
        }

        // Normalizza telefono
        const telefonoNormalizzato = telefono.startsWith('+39') ? telefono : `+39 ${telefono}`;

        // Converte stringhe vuote in NULL per campi opzionali (riutilizza le variabili già dichiarate)
        const capNormalizzato = cap && cap.trim() !== '' ? cap : null;
        const provinciaNormalizzata = provincia && provincia.trim() !== '' ? provincia : null;

        // Aggiorna cliente
        const result = await db.query(`
            UPDATE clienti SET
                nome = $1, cognome = $2, codiceFiscale = $3, email = $4, telefono = $5,
                indirizzo = $6, citta = $7, cap = $8, provincia = $9,
                provenienzaContatto = $10, consensoPrivacy = $11, consensoMarketing = $12,
                note = $13, dataModifica = NOW(), utenteModifica = $14
            WHERE clienteId = $15
        `, [
            nome, cognome, codiceFiscaleNormalizzato, emailNormalizzata, telefonoNormalizzato, indirizzo, citta, capNormalizzato, provinciaNormalizzata,
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
                nome, cognome, codiceFiscale, email, telefono: telefonoNormalizzato,
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
