const jwt = require('jsonwebtoken');
const db = require('../database-pg');

// Middleware per autenticazione JWT
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: 'Token di accesso richiesto',
            code: 'TOKEN_REQUIRED' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verifica che l'utente esista ancora
        const user = await db.get(
            'SELECT utenteId, email, nome, cognome, ruolo FROM utenti WHERE utenteId = ?',
            [decoded.utenteId]
        );

        if (!user) {
            return res.status(401).json({ 
                error: 'Utente non valido',
                code: 'INVALID_USER' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token scaduto',
                code: 'TOKEN_EXPIRED' 
            });
        }
        
        return res.status(403).json({ 
            error: 'Token non valido',
            code: 'INVALID_TOKEN' 
        });
    }
};

// Middleware per verificare ruolo amministratore
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Autenticazione richiesta',
            code: 'AUTH_REQUIRED' 
        });
    }

    if (req.user.ruolo !== 'Amministratore') {
        return res.status(403).json({ 
            error: 'Accesso riservato agli amministratori',
            code: 'ADMIN_REQUIRED' 
        });
    }

    next();
};

// Middleware per verificare permessi operatore o admin
const requireOperatorOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Autenticazione richiesta',
            code: 'AUTH_REQUIRED' 
        });
    }

    if (!['Operatore', 'Amministratore'].includes(req.user.ruolo)) {
        return res.status(403).json({ 
            error: 'Accesso non autorizzato',
            code: 'UNAUTHORIZED' 
        });
    }

    next();
};

// Middleware per logging automatico delle richieste autenticate
const logRequest = (req, res, next) => {
    if (req.user) {
        const action = `${req.method} ${req.path}`;
        const details = {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            body: req.method !== 'GET' ? req.body : undefined
        };

        // Log asincrono per non bloccare la richiesta
        setImmediate(() => {
            db.logActivity(
                req.user.utenteId,
                action,
                'api_request',
                null,
                JSON.stringify(details)
            );
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireOperatorOrAdmin,
    logRequest
};
