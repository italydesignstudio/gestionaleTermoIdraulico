const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database-pg');
const { authenticateToken, requireOperatorOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Configurazione multer per upload files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/documenti');
        // Crea directory se non esiste
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Nome file: clienteId_timestamp_nomeOriginale
        const clienteId = req.params.clienteId || req.body.clienteId;
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, extension);
        const fileName = `${clienteId}_${timestamp}_${nameWithoutExt}${extension}`;
        cb(null, fileName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        // Tipi di file consentiti
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain' // Aggiunto per i test
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo di file non supportato'));
        }
    }
});

// GET /api/documenti/cliente/:clienteId - Lista documenti di un cliente
router.get('/cliente/:clienteId', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { clienteId } = req.params;
        const { tipo } = req.query;

        // Verifica che il cliente esista
        const cliente = await db.get('SELECT clienteId FROM clienti WHERE clienteId = $1', [clienteId]);
        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        let whereClause = 'WHERE d.clienteId = $1';
        const params = [clienteId];

        if (tipo) {
            whereClause += ' AND d.tipoDocumento = $2';
            params.push(tipo);
        }

        const documenti = await db.all(`
            SELECT 
                d.*,
                u.nome as nomeUtenteCreazione,
                u.cognome as cognomeUtenteCreazione
            FROM documenti_cliente d
            LEFT JOIN utenti u ON d.utenteCreazione = u.utenteId
            ${whereClause}
            ORDER BY d.dataCreazione DESC
        `, params);

        res.json({
            documenti: documenti.map(doc => ({
                documentoId: doc.documentoid,
                tipoDocumento: doc.tipodocumento,
                titolo: doc.titolo,
                descrizione: doc.descrizione,
                nomeFile: doc.nomefile,
                dimensioneFile: doc.dimensionefile,
                mimeType: doc.mimetype,
                dataCreazione: doc.datacreazione,
                nomeUtenteCreazione: doc.nomeutentecreazione,
                cognomeUtenteCreazione: doc.cognomeutentecreazione
            }))
        });

    } catch (error) {
        console.error('Errore recupero documenti:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// POST /api/documenti/cliente/:clienteId - Upload nuovo documento
router.post('/cliente/:clienteId', authenticateToken, requireOperatorOrAdmin, upload.single('file'), async (req, res) => {
    try {
        const { clienteId } = req.params;
        const { tipoDocumento, titolo, descrizione } = req.body;

        if (!req.file) {
            return res.status(400).json({
                error: 'File richiesto',
                code: 'FILE_REQUIRED'
            });
        }

        // Verifica che il cliente esista
        const cliente = await db.get('SELECT clienteId FROM clienti WHERE clienteId = $1', [clienteId]);
        if (!cliente) {
            // Elimina il file caricato se il cliente non esiste
            fs.unlinkSync(req.file.path);
            return res.status(404).json({
                error: 'Cliente non trovato',
                code: 'CLIENT_NOT_FOUND'
            });
        }

        // Inserisci nel database
        const result = await db.query(`
            INSERT INTO documenti_cliente (
                clienteId, tipoDocumento, titolo, descrizione, 
                nomeFile, pathFile, dimensioneFile, mimeType, utenteCreazione
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING documentoId
        `, [
            clienteId, tipoDocumento, titolo, descrizione,
            req.file.filename, req.file.path, req.file.size, req.file.mimetype,
            req.user.utenteId
        ]);

        const documentoId = result.rows[0].documentoid;

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'CREATE', 'documenti_cliente', documentoId, 
            `Documento caricato: ${titolo} per cliente ${clienteId}`);

        res.status(201).json({
            message: 'Documento caricato con successo',
            documentoId,
            documento: {
                documentoId,
                tipoDocumento,
                titolo,
                descrizione,
                nomeFile: req.file.filename,
                dimensioneFile: req.file.size,
                mimeType: req.file.mimetype
            }
        });

    } catch (error) {
        console.error('Errore upload documento:', error);
        // Elimina il file se c'è stato un errore
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// GET /api/documenti/:documentoId/download - Download documento
router.get('/:documentoId/download', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { documentoId } = req.params;

        const documento = await db.get(`
            SELECT * FROM documenti_cliente WHERE documentoId = $1
        `, [documentoId]);

        if (!documento) {
            return res.status(404).json({
                error: 'Documento non trovato',
                code: 'DOCUMENT_NOT_FOUND'
            });
        }

        const filePath = documento.pathfile;
        
        // Verifica che il file esista
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'File non trovato sul server',
                code: 'FILE_NOT_FOUND'
            });
        }

        // Imposta headers per download
        res.setHeader('Content-Disposition', `attachment; filename="${documento.nomefile}"`);
        res.setHeader('Content-Type', documento.mimetype);
        
        // Stream del file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Errore download documento:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// DELETE /api/documenti/:documentoId - Elimina documento
router.delete('/:documentoId', authenticateToken, requireOperatorOrAdmin, async (req, res) => {
    try {
        const { documentoId } = req.params;

        const documento = await db.get(`
            SELECT * FROM documenti_cliente WHERE documentoId = $1
        `, [documentoId]);

        if (!documento) {
            return res.status(404).json({
                error: 'Documento non trovato',
                code: 'DOCUMENT_NOT_FOUND'
            });
        }

        // Elimina dal database
        await db.query('DELETE FROM documenti_cliente WHERE documentoId = $1', [documentoId]);

        // Elimina il file fisico
        if (fs.existsSync(documento.pathfile)) {
            fs.unlinkSync(documento.pathfile);
        }

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'DELETE', 'documenti_cliente', documentoId,
            `Documento eliminato: ${documento.titolo}`);

        res.json({
            message: 'Documento eliminato con successo'
        });

    } catch (error) {
        console.error('Errore eliminazione documento:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
