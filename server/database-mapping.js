// Mapping per compatibilità con database Render
// Database Render ha una struttura diversa da quella locale

const DB_MAPPING = {
    // Tabella utenti
    utenti: {
        id: 'utenteid',
        username: 'email', // Usiamo email come username
        password: 'password',
        ruolo: 'ruolo',
        email: 'email',
        nome: 'nome',
        cognome: 'cognome',
        created_at: 'datacreazione',
        updated_at: 'ultimoaccesso'
    },
    
    // Tabella clienti
    clienti: {
        id: 'clienteid',
        nome: 'nome',
        cognome: 'cognome',
        email: 'email',
        telefono: 'telefono',
        indirizzo: 'indirizzo',
        citta: 'citta',
        cap: 'cap',
        provincia: 'provincia',
        provenienza: 'provenienzacontatto',
        consenso_privacy: 'consensoprivacy',
        consenso_marketing: 'consensomarketing',
        note: 'note',
        created_at: 'datacreazione',
        updated_at: 'datamodifica',
        utente_creazione: 'utentecreazione',
        utente_modifica: 'utentemodifica'
    },

    // Tabella password_info
    password_info: {
        id: 'infoid',
        sito: 'titolo',
        url: 'url',
        username: 'username',
        password: 'passwordcifrata',
        note: 'note',
        categoria: 'categoria',
        email: 'email',
        codici: 'codici',
        descrizione: 'descrizione',
        created_at: 'datainserimento',
        updated_at: 'datamodifica',
        utente_creazione: 'utentecreazione',
        utente_modifica: 'utentemodifica'
    }
};

// Helper functions per mapping
function mapToRenderSchema(table, data) {
    const mapping = DB_MAPPING[table];
    if (!mapping) return data;
    
    const mapped = {};
    Object.keys(data).forEach(key => {
        if (mapping[key]) {
            mapped[mapping[key]] = data[key];
        } else {
            mapped[key] = data[key];
        }
    });
    return mapped;
}

function mapFromRenderSchema(table, data) {
    const mapping = DB_MAPPING[table];
    if (!mapping) return data;
    
    const mapped = {};
    Object.keys(mapping).forEach(localKey => {
        const renderKey = mapping[localKey];
        if (data[renderKey] !== undefined) {
            mapped[localKey] = data[renderKey];
        }
    });
    return mapped;
}

module.exports = {
    DB_MAPPING,
    mapToRenderSchema,
    mapFromRenderSchema
};
