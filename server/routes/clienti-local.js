// Route dinamiche per clienti - sceglie tra SQLite e PostgreSQL
const isDevelopment = process.env.NODE_ENV === 'development';
const useLocalSQLite = process.env.DATABASE_TYPE === 'sqlite' || (!process.env.DATABASE_URL && isDevelopment);

if (useLocalSQLite) {
    console.log('📁 Using SQLite routes for clienti');
    module.exports = require('./clienti-sqlite');
} else {
    console.log('📁 Using PostgreSQL routes for clienti');
    module.exports = require('./clienti-pg');
}
