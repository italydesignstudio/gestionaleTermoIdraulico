const axios = require('axios');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dGVudGVJZCI6MSwiZW1haWwiOiJhZG1pbkB0ZXJtb2lkcmF1bGljby5pdCIsInJ1b2xvIjoiQW1taW5pc3RyYXRvcmUiLCJpYXQiOjE3NTUwOTcyNzEsImV4cCI6MTc1NTE4MzY3MX0._CDk3xKDegK2E0MaaM12xDQvgLGJs75kqfn3U5cmTcA';
const API_URL = 'http://localhost:3000/api/password-info';

const passwords = [
    {
        titolo: "Aruba Fatturazione",
        descrizione: "Aruba Fatturazione Elettronica - ARUBA04613690231",
        valore: "Kill.all1234"
    },
    {
        titolo: "Aruba Account",
        descrizione: "Aruba Account - 10093180@aruba.it",
        valore: "Attenzione1!"
    },
    {
        titolo: "Gmail Ditta",
        descrizione: "Gmail Aziendale - pietriassistenza@gmail.com",
        valore: "AssistenzaPjetri/Attenzione1!"
    },
    {
        titolo: "Immergas",
        descrizione: "Immergas Account - T220000666",
        valore: "pjetri"
    },
    {
        titolo: "Marco Web Shop",
        descrizione: "Marco Web Shop - Pjetriservizi",
        valore: "Attenzione1"
    },
    {
        titolo: "Amazon Business",
        descrizione: "Amazon Business - pietriassistenza@gmail.com",
        valore: "solotechamazon"
    },
    {
        titolo: "SPID",
        descrizione: "SPID - pietriassistenza@gmail.com",
        valore: "Attenzione1??"
    },
    {
        titolo: "MyInfocert App",
        descrizione: "MyInfocert App - pietriassistenza@gmail.com",
        valore: "Attenzione1!!"
    },
    {
        titolo: "Apple ID",
        descrizione: "Apple ID Account",
        valore: "Attenzione1!"
    },
    {
        titolo: "QCell Fotovoltaico",
        descrizione: "QCell Fotovoltaico - User: Ermir",
        valore: "Attenzione1!"
    },
    {
        titolo: "InfoCert Firma",
        descrizione: "InfoCert Firma Digitale - PIN: 95598852",
        valore: "Attenzione1"
    },
    {
        titolo: "SumUp",
        descrizione: "SumUp - pietriassistenza@gmail.com",
        valore: "Attenzione1!!"
    },
    {
        titolo: "GSE",
        descrizione: "GSE (Gestore Servizi Energetici) - PJTRMR83L26Z100R",
        valore: "Attenzione1!"
    },
    {
        titolo: "ACCA Software",
        descrizione: "ACCA Software - pietriassistenza@gmail.com",
        valore: "AttenzioneACCA2!"
    },
    {
        titolo: "Fastweb",
        descrizione: "Fastweb - ermir.pjetri",
        valore: "fpJvktsv8w"
    },
    {
        titolo: "Avelia",
        descrizione: "Avelia - pietriassistenza@gmail.com",
        valore: "e7d64195"
    },
    {
        titolo: "ARBO",
        descrizione: "ARBO - Pietrie83@gmail.com",
        valore: "Attenzione1!"
    },
    {
        titolo: "Haier Standard",
        descrizione: "Haier Account Standard - cli11095",
        valore: "Attenzione1!"
    },
    {
        titolo: "Haier B2B",
        descrizione: "Haier B2B - cli11095",
        valore: "Attenzione1!"
    },
    {
        titolo: "Haier Garanzia",
        descrizione: "Haier Garanzia - pietriassistenza@gmail.com",
        valore: "zv62p5x"
    },
    {
        titolo: "Haier SuperMatch",
        descrizione: "Haier SuperMatch - pietriassistenza@gmail.com",
        valore: "Attenzione1!"
    },
    {
        titolo: "Agora Ricambi",
        descrizione: "Agora per ricambi/interventi garanzia - User: 380B000137805",
        valore: "8qB06861FA9"
    },
    {
        titolo: "Haier Condizionatori",
        descrizione: "Haier Condizionatori - cli11095",
        valore: "mho994"
    },
    {
        titolo: "FondoTax Benefit Azienda",
        descrizione: "FondoTax Benefit TFR Azienda - a00011761699",
        valore: "Attenzione2!"
    },
    {
        titolo: "FondoTax Benefit Utente",
        descrizione: "FondoTax Benefit TFR Utente - pietriassistenza@gmail.com",
        valore: "Attenzione2!"
    },
    {
        titolo: "Fausto Ricambi",
        descrizione: "Fausto Ricambi di Loreta Srl - pietriassistenza@gmail.com",
        valore: "Attenzione1!"
    },
    {
        titolo: "VOIspeed",
        descrizione: "VOIspeed - 21@pjetri.ucloud",
        valore: "Attenzione1!"
    },
    {
        titolo: "AUTODOC",
        descrizione: "AUTODOC - pietriassistenza@gmail.com",
        valore: "Attenzione1!"
    },
    {
        titolo: "ENESCO Conto Termico",
        descrizione: "ENESCO Conto Termico - info@pjetriservizi.it",
        valore: "Attenzione1!"
    }
];

async function insertPassword(password) {
    try {
        const response = await axios.post(API_URL, password, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ ${password.titolo} - ${response.data.message}`);
        return true;
    } catch (error) {
        if (error.response?.data?.code === 'RATE_LIMIT_EXCEEDED') {
            console.log(`⏳ Rate limit per ${password.titolo}, aspetto...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return insertPassword(password); // Riprova
        } else {
            console.error(`❌ Errore ${password.titolo}:`, error.response?.data?.error || error.message);
            return false;
        }
    }
}

async function importAllPasswords() {
    console.log(`🔐 Inizio importazione di ${passwords.length} password...`);
    
    for (let i = 0; i < passwords.length; i++) {
        const password = passwords[i];
        console.log(`[${i + 1}/${passwords.length}] Inserimento: ${password.titolo}`);
        
        await insertPassword(password);
        
        // Pausa tra le richieste per evitare rate limiting
        if (i < passwords.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('🎉 Importazione completata!');
}

importAllPasswords().catch(console.error);
