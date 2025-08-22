const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./database-pg');
const { authenticateToken, logRequest } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://gestionale-termoidraulico.vercel.app'])
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minuti
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Troppe richieste da questo IP, riprova più tardi',
        code: 'RATE_LIMIT_EXCEEDED'
    }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API Routes - l'autenticazione è gestita singolarmente in ogni route
app.use('/api/utenti', require('./routes/utenti'));
app.use('/api/clienti', require('./routes/clienti'));
app.use('/api/password-info', require('./routes/password-info'));

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint non trovato',
        code: 'ENDPOINT_NOT_FOUND',
        path: req.originalUrl
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Errore non gestito:', err);
    
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Errore interno del server' 
            : err.message,
        code: 'INTERNAL_ERROR'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM ricevuto, chiusura server...');
    server.close(() => {
        console.log('Server chiuso');
        db.close().then(() => {
            console.log('Database chiuso');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT ricevuto, chiusura server...');
    server.close(() => {
        console.log('Server chiuso');
        db.close().then(() => {
            console.log('Database chiuso');
            process.exit(0);
        });
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
🚀 Server avviato con successo!
📊 Ambiente: ${process.env.NODE_ENV || 'development'}
🌐 URL: http://localhost:${PORT}
📖 API Docs: http://localhost:${PORT}/api
💾 Database: PostgreSQL
🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configurato' : '❌ Mancante'}

🎯 Endpoints principali:
   GET  /health - Health check
   POST /api/utenti/register - Registrazione
   POST /api/utenti/login - Login
   GET  /api/clienti - Lista clienti
   GET  /api/password-info - Dati sensibili (admin)
    `);
});

module.exports = app;
