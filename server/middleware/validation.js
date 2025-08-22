const { body, validationResult } = require('express-validator');

// Validazioni per utenti
const validateUserRegistration = [
    body('nome')
        .notEmpty()
        .withMessage('Nome è obbligatorio')
        .isLength({ min: 2, max: 50 })
        .withMessage('Nome deve essere tra 2 e 50 caratteri')
        .matches(/^[a-zA-ZÀ-ÿ\s']+$/)
        .withMessage('Nome può contenere solo lettere, spazi e apostrofi'),
    
    body('cognome')
        .notEmpty()
        .withMessage('Cognome è obbligatorio')
        .isLength({ min: 2, max: 50 })
        .withMessage('Cognome deve essere tra 2 e 50 caratteri')
        .matches(/^[a-zA-ZÀ-ÿ\s']+$/)
        .withMessage('Cognome può contenere solo lettere, spazi e apostrofi'),
    
    body('email')
        .isEmail()
        .withMessage('Email non valida')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('Email troppo lunga'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password deve essere di almeno 8 caratteri')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password deve contenere almeno una lettera minuscola, una maiuscola e un numero'),
    
    body('ruolo')
        .optional()
        .isIn(['Operatore', 'Amministratore'])
        .withMessage('Ruolo non valido')
];

const validateUserLogin = [
    body('email')
        .isEmail()
        .withMessage('Email non valida')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password è obbligatoria')
];

// Validazioni per clienti
const validateClient = [
    body('nome')
        .notEmpty()
        .withMessage('Nome è obbligatorio')
        .isLength({ min: 2, max: 50 })
        .withMessage('Nome deve essere tra 2 e 50 caratteri')
        .matches(/^[a-zA-ZÀ-ÿ\s']+$/)
        .withMessage('Nome può contenere solo lettere, spazi e apostrofi'),
    
    body('cognome')
        .notEmpty()
        .withMessage('Cognome è obbligatorio')
        .isLength({ min: 2, max: 50 })
        .withMessage('Cognome deve essere tra 2 e 50 caratteri')
        .matches(/^[a-zA-ZÀ-ÿ\s']+$/)
        .withMessage('Cognome può contenere solo lettere, spazi e apostrofi'),
    
    body('email')
        .isEmail()
        .withMessage('Email non valida')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('Email troppo lunga'),
    
    body('telefono')
        .notEmpty()
        .withMessage('Telefono è obbligatorio')
        .matches(/^\+39\s?\d{3}\s?\d{3}\s?\d{4}$|^\d{3}\s?\d{3}\s?\d{4}$/)
        .withMessage('Formato telefono non valido (es: +39 123 456 7890 o 123 456 7890)'),
    
    body('indirizzo')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Indirizzo troppo lungo'),
    
    body('citta')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Città troppo lunga')
        .matches(/^[a-zA-ZÀ-ÿ\s'.-]*$/)
        .withMessage('Città può contenere solo lettere, spazi, apostrofi, punti e trattini'),
    
    body('cap')
        .optional()
        .matches(/^\d{5}$/)
        .withMessage('CAP deve essere di 5 cifre'),
    
    body('provincia')
        .optional()
        .isLength({ min: 2, max: 2 })
        .withMessage('Provincia deve essere di 2 caratteri')
        .matches(/^[A-Z]{2}$/)
        .withMessage('Provincia deve essere in formato maiuscolo (es: MI, RM)'),
    
    body('provenienzaContatto')
        .notEmpty()
        .withMessage('Provenienza contatto è obbligatoria')
        .isIn(['Passaparola', 'Google', 'Facebook', 'Instagram', 'Volantino', 'Giornale', 'Radio', 'TV', 'Sito web', 'Cliente esistente', 'Altro'])
        .withMessage('Provenienza contatto non valida'),
    
    body('consensoPrivacy')
        .notEmpty()
        .withMessage('Consenso privacy è obbligatorio')
        .isBoolean()
        .withMessage('Consenso privacy deve essere true o false')
        .custom((value) => {
            if (value !== true) {
                throw new Error('Consenso privacy è obbligatorio per salvare il cliente');
            }
            return true;
        }),
    
    body('consensoMarketing')
        .optional()
        .isBoolean()
        .withMessage('Consenso marketing deve essere true o false'),
    
    body('note')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Note troppo lunghe (max 1000 caratteri)')
];

// Validazioni per password e info
const validatePasswordInfo = [
    body('titolo')
        .notEmpty()
        .withMessage('Titolo è obbligatorio')
        .isLength({ min: 3, max: 100 })
        .withMessage('Titolo deve essere tra 3 e 100 caratteri'),
    
    body('categoria')
        .optional()
        .isIn(['Termoidraulica', 'Email', 'Software', 'PA_Fiscale', 'E-commerce', 
               'Servizi_Web', 'Fornitori', 'Bancario', 'Social', 'Altro'])
        .withMessage('Categoria non valida'),
    
    body('url')
        .optional({ checkFalsy: true })
        .isURL()
        .withMessage('URL non valido')
        .isLength({ max: 500 })
        .withMessage('URL troppo lungo'),
    
    body('username')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Username troppo lungo (max 100 caratteri)'),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email non valida')
        .isLength({ max: 100 })
        .withMessage('Email troppo lunga'),
    
    body('password')
        .notEmpty()
        .withMessage('Password è obbligatoria')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Password deve essere tra 1 e 1000 caratteri'),
    
    body('codici')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Codici troppo lunghi (max 200 caratteri)'),
    
    body('descrizione')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Descrizione troppo lunga (max 500 caratteri)'),
    
    body('note')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Note troppo lunghe (max 1000 caratteri)')
];

// Middleware per gestire errori di validazione
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

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateClient,
    validatePasswordInfo,
    handleValidationErrors
};
