const fs = require('fs');
const path = require('path');

// Funzione per convertire query SQLite in PostgreSQL
function convertSQLiteToPostgreSQL(content) {
    let convertedContent = content;
    
    // Sostituisce i placeholder ? con $1, $2, etc.
    let placeholderIndex = 1;
    convertedContent = convertedContent.replace(/\?/g, () => `$${placeholderIndex++}`);
    
    // Converte LIKE case-insensitive
    convertedContent = convertedContent.replace(/LIKE \$(\d+)/g, 'ILIKE $$$1');
    
    // Converte BOOLEAN per consenso
    convertedContent = convertedContent.replace(/consensoPrivacy \? 1 : 0/g, 'consensoPrivacy');
    convertedContent = convertedContent.replace(/consensoMarketing \? 1 : 0/g, 'consensoMarketing');
    convertedContent = convertedContent.replace(/consensoMarketing === 'true' \? 1 : 0/g, "consensoMarketing === 'true'");
    
    // Converte CURRENT_TIMESTAMP
    convertedContent = convertedContent.replace(/CURRENT_TIMESTAMP/g, 'NOW()');
    
    // Converte db.run e gestisce il risultato
    convertedContent = convertedContent.replace(/const result = await db\.run\(/g, 'const result = await db.query(');
    convertedContent = convertedContent.replace(/result\.id/g, 'result.rows[0]?.clienteid || result.rows[0]?.utenteid || result.rows[0]?.infoid');
    convertedContent = convertedContent.replace(/result\.changes/g, 'result.rowCount');
    
    return convertedContent;
}

// File da convertire
const filesToConvert = [
    './routes/clienti.js',
    './routes/password-info.js'
];

filesToConvert.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const convertedContent = convertSQLiteToPostgreSQL(content);
        
        // Backup del file originale
        fs.writeFileSync(filePath + '.backup', content);
        
        // Scrivi il file convertito
        fs.writeFileSync(filePath, convertedContent);
        
        console.log(`✅ Convertito: ${filePath}`);
    } else {
        console.log(`❌ File non trovato: ${filePath}`);
    }
});

console.log('🚀 Conversione completata!');
