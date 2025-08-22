const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database-pg');
const { validateUserRegistration, validateUserLogin, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/utenti/register - Registrazione nuovo utente
router.post('/register', validateUserRegistration, handleValidationErrors, async (req, res) => {
    try {
        const { nome, cognome, email, password, ruolo = 'Operatore' } = req.body;

        // Verifica se email già esistente
        const existingUser = await db.get('SELECT email FROM utenti WHERE email = $1', [email]);
        if (existingUser) {
            return res.status(400).json({
                error: 'Email già registrata',
                code: 'EMAIL_EXISTS'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

        // Inserisci nuovo utente
        const result = await db.query(
            'INSERT INTO utenti (nome, cognome, email, password, ruolo) VALUES ($1, $2, $3, $4, $5) RETURNING utenteId',
            [nome, cognome, email, hashedPassword, ruolo]
        );

        const utenteId = result.rows[0].utenteid;

        // Log dell'operazione
        db.logActivity(utenteId, 'CREATE', 'utenti', utenteId, `Nuovo utente registrato: ${email}`);

        res.status(201).json({
            message: 'Utente registrato con successo',
            utenteId: utenteId,
            user: {
                utenteId: utenteId,
                nome,
                cognome,
                email,
                ruolo
            }
        });

    } catch (error) {
        console.error('Errore registrazione:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// POST /api/utenti/login - Login utente
router.post('/login', validateUserLogin, handleValidationErrors, async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        console.log('Request headers:', req.headers);
        
        const { email, password } = req.body;

        // Trova utente
        const user = await db.get(
            'SELECT utenteId, nome, cognome, email, password, ruolo FROM utenti WHERE email = $1',
            [email]
        );

        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('User not found for email:', email);
            return res.status(401).json({
                error: 'Credenziali non valide',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Verifica password
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', validPassword);
        
        if (!validPassword) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({
                error: 'Credenziali non valide',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Aggiorna ultimo accesso
        await db.query(
            'UPDATE utenti SET ultimoAccesso = CURRENT_TIMESTAMP WHERE utenteId = $1',
            [user.utenteid]
        );

        // Genera JWT
        const token = jwt.sign(
            { 
                utenteId: user.utenteid, 
                email: user.email, 
                ruolo: user.ruolo 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Log dell'operazione
        db.logActivity(user.utenteid, 'LOGIN', 'utenti', user.utenteid, `Login effettuato da ${email}`);

        res.json({
            message: 'Login effettuato con successo',
            token,
            user: {
                utenteId: user.utenteid,
                nome: user.nome,
                cognome: user.cognome,
                email: user.email,
                ruolo: user.ruolo
            }
        });

    } catch (error) {
        console.error('Errore login:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// GET /api/utenti/me - Profilo utente corrente
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.get(
            'SELECT utenteId, nome, cognome, email, ruolo, dataCreazione, ultimoAccesso FROM utenti WHERE utenteId = $1',
            [req.user.utenteId]
        );

        if (!user) {
            return res.status(404).json({
                error: 'Utente non trovato',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            user
        });

    } catch (error) {
        console.error('Errore recupero profilo:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// GET /api/utenti - Lista utenti (solo admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await db.all(`
            SELECT 
                utenteId, nome, cognome, email, ruolo, 
                dataCreazione, ultimoAccesso
            FROM utenti 
            ORDER BY cognome, nome
        `);

        res.json({
            users,
            total: users.length
        });

    } catch (error) {
        console.error('Errore recupero utenti:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

// PUT /api/utenti/:id/ruolo - Modifica ruolo utente (solo admin)
router.put('/:id/ruolo', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { ruolo } = req.body;

        if (!['Operatore', 'Amministratore'].includes(ruolo)) {
            return res.status(400).json({
                error: 'Ruolo non valido',
                code: 'INVALID_ROLE'
            });
        }

        // Non permettere di modificare il proprio ruolo
        if (parseInt(id) === req.user.utenteId) {
            return res.status(400).json({
                error: 'Non puoi modificare il tuo ruolo',
                code: 'CANNOT_MODIFY_OWN_ROLE'
            });
        }

        const result = await db.query(
            'UPDATE utenti SET ruolo = $1 WHERE utenteId = $2',
            [ruolo, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'Utente non trovato',
                code: 'USER_NOT_FOUND'
            });
        }

        // Log dell'operazione
        db.logActivity(req.user.utenteId, 'UPDATE', 'utenti', id, `Ruolo modificato in: ${ruolo}`);

        res.json({
            message: 'Ruolo aggiornato con successo'
        });

    } catch (error) {
        console.error('Errore modifica ruolo:', error);
        res.status(500).json({
            error: 'Errore interno del server',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
