const express = require('express');
const db = require('../database-pg');
const { authenticateToken, requireOperatorOrAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validazioni per comunicazioni
const validateComunicazione = [
    body('tipoComunicazione')
        .isIn(['Chiamata', 'WhatsApp', 'Email', 'SMS', 'Nota', 'Promemoria', 'Altro'])
        .withMessage('Tipo comunicazione non valido'),
    
    body('oggetto')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Oggetto troppo lungo (max 255 caratteri)'),
    
    body('contenuto')
        .notEmpty()
        .withMessage('Contenuto è obbligatorio')
        .isLength({ max: 5000 })
        .withMessage('Contenuto troppo lungo (max 5000 caratteri)'),
    
    body('priorita')
        .optional()
        .isIn(['Bassa', 'Media', 'Alta', 'Urgente'])
        .withMessage('Priorità non valida')
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Errori di validazione',
            code: 'VALIDATION_ERROR',
            details: errors.array()
        });
    }
    next();
};

// GET /api/comunicazioni/cliente/:clienteId - Lista comunicazioni di un cliente
router.get('/cliente/:clienteId', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { clienteId } = req.params;
        const { tipo, limite = 50, pagina = 1 } = req.query;

        // Verifica che il cliente esista
        const cliente = await db.get('SELECT clienteId FROM clienti WHERE clienteId = $1', [clienteId]);
        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        let whereClause = 'WHERE c.clienteId = $1';
        const params = [clienteId];

        if (tipo) {
            whereClause += ' AND c.tipoComunicazione = $2';
            params.push(tipo);
        }

        const offset = (pagina - 1) * limite;
        const finalParams = [...params, parseInt(limite), offset];

        const comunicazioni = await db.all(`
            SELECT 
                c.*,
                u.nome as nomeUtenteCreazione,
                u.cognome as cognomeUtenteCreazione
            FROM comunicazioni_cliente c
            LEFT JOIN utenti u ON c.utenteCreazione = u.utenteId
            ${whereClause}
            ORDER BY c.dataOra DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, finalParams);

        // Conteggio totale
        const countResult = await db.get(`
            SELECT COUNT(*) as total 
            FROM comunicazioni_cliente c 
            ${whereClause}
        `, params);

        res.json({
            comunicazioni: comunicazioni.map(com => ({
                comunicazioneId: com.comunicazioneid,
                tipoComunicazione: com.tipocomunicazione,
                oggetto: com.oggetto,
                contenuto: com.contenuto,
                dataOra: com.dataora,
                statoLettura: com.statolettura,
                priorita: com.priorita,
                nomeUtenteCreazione: com.nomeutentecreazione,
                cognomeUtenteCreazione: com.cognomeutentecreazione
            })),
            pagination: {
                current: parseInt(pagina),
                total: Math.ceil(countResult.total / limite),
                hasNext: (pagina * limite) < countResult.total,
                hasPrev: pagina > 1,
                totalRecords: parseInt(countResult.total)
            }
        });

    } catch (error) {
        console.error('Errore recupero comunicazioni:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// POST /api/comunicazioni/cliente/:clienteId - Nuova comunicazione
router.post('/cliente/:clienteId', authenticateToken, requireOperatorOrAdmin, validateComunicazione, handleValidationErrors, async (req, res) => {
    try {
        const { clienteId } = req.params;
        const { tipoComunicazione, oggetto, contenuto, priorita = 'Media' } = req.body;

        // Verifica che il cliente esista
        const cliente = await db.get('SELECT clienteId, nome, cognome FROM clienti WHERE clienteId = $1', [clienteId]);
        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // Inserisci comunicazione
        const result = await db.query(`
            INSERT INTO comunicazioni_cliente (
                clienteId, tipoComunicazione, oggetto, contenuto, priorita, utenteCreazione
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING comunicazioneId
        `, [clienteId, tipoComunicazione, oggetto, contenuto, priorita, req.user.utenteId]);

        const comunicazioneId = result.rows[0].comunicazioneid;

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'CREATE', 'comunicazioni_cliente', comunicazioneId,
            `${tipoComunicazione} con ${cliente.nome} ${cliente.cognome}: ${oggetto || contenuto.substring(0, 50)}`);

        res.status(201).json({
            message: 'Comunicazione registrata con successo',
            comunicazioneId,
            comunicazione: {
                comunicazioneId,
                tipoComunicazione,
                oggetto,
                contenuto,
                priorita,
                dataOra: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Errore creazione comunicazione:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// PUT /api/comunicazioni/:comunicazioneId/lettura - Marca come letta
router.put('/:comunicazioneId/lettura', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { comunicazioneId } = req.params;
        const { letta = true } = req.body;

        const result = await db.query(`
            UPDATE comunicazioni_cliente 
            SET statoLettura = $1 
            WHERE comunicazioneId = $2
        `, [letta, comunicazioneId]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Comunicazione non trovata',
                code: 'COMMUNICATION_NOT_FOUND'
            });
        }

        res.json({
            message: 'Stato lettura aggiornato con successo'
        });

    } catch (error) {
        console.error('Errore aggiornamento lettura:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// DELETE /api/comunicazioni/:comunicazioneId - Elimina comunicazione
router.delete('/:comunicazioneId', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { comunicazioneId } = req.params;

        const comunicazione = await db.get(`
            SELECT * FROM comunicazioni_cliente WHERE comunicazioneId = $1
        `, [comunicazioneId]);

        if (!comunicazione) {
            return res.status(404).json({
                error: 'Comunicazione non trovata',
                code: 'COMMUNICATION_NOT_FOUND'
            });
        }

        await db.query('DELETE FROM comunicazioni_cliente WHERE comunicazioneId = $1', [comunicazioneId]);

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'DELETE', 'comunicazioni_cliente', comunicazioneId,
            `Comunicazione eliminata: ${comunicazione.oggetto || 'Senza oggetto'}`);

        res.json({
            message: 'Comunicazione eliminata con successo'
        });

    } catch (error) {
        console.error('Errore eliminazione comunicazione:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// GET /api/comunicazioni/cliente/:clienteId/whatsapp - Apri WhatsApp
router.get('/cliente/:clienteId/whatsapp', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { clienteId } = req.params;
        const { messaggio = '' } = req.query;

        const cliente = await db.get(`
            SELECT telefono, nome, cognome FROM clienti WHERE clienteId = $1
        `, [clienteId]);

        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // Rimuovi spazi e caratteri speciali dal numero
        const numeroPulito = cliente.telefono.replace(/\D/g, '');
        
        // URL WhatsApp
        const whatsappUrl = `https://wa.me/${numeroPulito}${messaggio ? `?text=${encodeURIComponent(messaggio)}` : ''}`;

        res.json({
            whatsappUrl,
            numeroTelefono: cliente.telefono,
            nomeCliente: `${cliente.nome} ${cliente.cognome}`
        });

    } catch (error) {
        console.error('Errore generazione link WhatsApp:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// GET /api/comunicazioni/cliente/:clienteId/chiamata - Genera link chiamata
router.get('/cliente/:clienteId/chiamata', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { clienteId } = req.params;

        const cliente = await db.get(`
            SELECT telefono, nome, cognome FROM clienti WHERE clienteId = $1
        `, [clienteId]);

        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // URL tel: per avviare chiamata
        const callUrl = `tel:${cliente.telefono}`;

        res.json({
            callUrl,
            numeroTelefono: cliente.telefono,
            nomeCliente: `${cliente.nome} ${cliente.cognome}`
        });

    } catch (error) {
        console.error('Errore generazione link chiamata:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// GET /api/comunicazioni/cliente/:clienteId/email - Genera link email
router.get('/cliente/:clienteId/email', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { clienteId } = req.params;
        const { oggetto = '', corpo = '' } = req.query;

        const cliente = await db.get(`
            SELECT email, nome, cognome FROM clienti WHERE clienteId = $1
        `, [clienteId]);

        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // URL mailto per aprire client email
        let mailtoUrl = `mailto:${cliente.email}`;
        const params = [];
        
        if (oggetto) params.push(`subject=${encodeURIComponent(oggetto)}`);
        if (corpo) params.push(`body=${encodeURIComponent(corpo)}`);
        
        if (params.length > 0) {
            mailtoUrl += `?${params.join('&')}`;
        }

        res.json({
            mailtoUrl,
            emailCliente: cliente.email,
            nomeCliente: `${cliente.nome} ${cliente.cognome}`
        });

    } catch (error) {
        console.error('Errore generazione link email:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
