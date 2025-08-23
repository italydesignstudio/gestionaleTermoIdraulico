// Database configuration for local development
const path = require('path');

// Determina quale database usare in base all'ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const useLocalSQLite = process.env.DATABASE_TYPE === 'sqlite' || (!process.env.DATABASE_URL && isDevelopment);

if (useLocalSQLite) {
    console.log('🗃️  Using SQLite database for local development');
    module.exports = require('./database');
} else {
    console.log('🐘 Using PostgreSQL database');
    module.exports = require('./database-pg');
}
