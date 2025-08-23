// Route dinamiche per password-info - sceglie tra SQLite e PostgreSQL
const isDevelopment = process.env.NODE_ENV === 'development';
const useLocalSQLite = process.env.DATABASE_TYPE === 'sqlite' || (!process.env.DATABASE_URL && isDevelopment);

if (useLocalSQLite) {
    console.log('📁 Using SQLite routes for password-info');
    module.exports = require('./password-info-sqlite');
} else {
    console.log('📁 Using PostgreSQL routes for password-info');
    module.exports = require('./password-info-pg');
}
