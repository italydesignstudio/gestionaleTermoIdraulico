import { vi } from 'vitest'
import { Cliente, ClienteFormData } from '../types'

// Mock dati cliente per i test
export const mockCliente: Cliente = {
  clienteId: 1,
  nome: 'Mario',
  cognome: 'Rossi',
  codiceFiscale: 'RSSMRA80A01H501U',
  email: 'mario.rossi@example.com',
  telefono: '+39 123 456 789',
  indirizzo: 'Via Roma 123',
  citta: 'Milano',
  cap: '20100',
  provincia: 'MI',
  provenienzaContatto: 'Google',
  consensoPrivacy: true,
  consensoMarketing: false,
  note: 'Cliente di prova',
  dataCreazione: '2024-01-15T10:00:00Z',
  dataModifica: '2024-01-15T10:00:00Z',
  utenteCreazione: 1,
  utenteModifica: 1,
  nomeUtenteCreazione: 'Admin',
  cognomeUtenteCreazione: 'User',
}

export const mockClienteLista: Cliente[] = [
  mockCliente,
  {
    ...mockCliente,
    clienteId: 2,
    nome: 'Lucia',
    cognome: 'Bianchi',
    codiceFiscale: 'BNCLCU80A01H501U',
    email: 'lucia.bianchi@example.com',
    provenienzaContatto: 'Facebook',
  },
  {
    ...mockCliente,
    clienteId: 3,
    nome: 'Giuseppe',
    cognome: 'Verdi',
    codiceFiscale: 'VRDGPP80A01H501U',
    email: 'giuseppe.verdi@example.com',
    provenienzaContatto: 'Passaparola',
  }
]

// Mock del servizio clienti
export const mockClientiService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteCliente: vi.fn(),
  getStats: vi.fn(),
  getClienti: vi.fn(),
  getProvenienzaContatti: vi.fn(),
}

// Mock del servizio documenti  
export const mockDocumentiService = {
  getDocumentiCliente: vi.fn(),
  uploadDocumento: vi.fn(),
  downloadDocumento: vi.fn(),
  deleteDocumento: vi.fn(),
}

// Mock del servizio comunicazioni
export const mockComunicazioniService = {
  getComunicazioniCliente: vi.fn(),
  createComunicazione: vi.fn(),
  updateComunicazione: vi.fn(),
  deleteComunicazione: vi.fn(),
  markAsRead: vi.fn(),
  getComunicazioniPerTipo: vi.fn(),
}

// Funzioni di utilità per configurare i mock
export const setupMockClientiService = () => {
  mockClientiService.getAll.mockResolvedValue(mockClienteLista)
  mockClientiService.getById.mockResolvedValue(mockClienteLista[0])
  mockClientiService.getClienti.mockResolvedValue({
    clienti: mockClienteLista,
    pagination: {
      current: 1,
      total: 1,
      hasNext: false,
      hasPrev: false,
      totalRecords: mockClienteLista.length
    },
    filters: {}
  })
  mockClientiService.create.mockResolvedValue({ 
    message: 'Cliente creato con successo',
    clienteId: 99
  })
  mockClientiService.update.mockResolvedValue({ 
    message: 'Cliente aggiornato con successo'
  })
  mockClientiService.delete.mockResolvedValue(undefined)
  mockClientiService.deleteCliente.mockResolvedValue(undefined)
  mockClientiService.getStats.mockResolvedValue({
    totalClienti: 100,
    clientiAttivi: 85,
    clientiInattivi: 15,
    incrementoMensile: 5.2,
    provenienzaContatti: {
      'Cliente esistente': 20,
      'Facebook': 15,
      'Google': 30,
      'Passaparola': 25,
      'Altri': 10
    },
    andamentoMensile: [
      { mese: 'Gen 2024', count: 10 },
      { mese: 'Feb 2024', count: 15 },
      { mese: 'Mar 2024', count: 12 }
    ]
  })
  mockClientiService.getProvenienzaContatti.mockReturnValue([
    'Cliente esistente',
    'Facebook', 
    'Giornale',
    'Google',
    'Instagram',
    'Passaparola',
    'Radio',
    'Sito web',
    'TV',
    'Volantino'
  ])
}

export const setupMockDocumentiService = () => {
  mockDocumentiService.getDocumentiCliente.mockResolvedValue([])
  mockDocumentiService.uploadDocumento.mockResolvedValue({
    message: 'Documento caricato con successo',
    documento: {
      documentoId: 1,
      nomeFile: 'test.pdf',
      tipoFile: 'application/pdf',
      dimensione: 1024,
      dataCaricamento: '2024-01-15T10:00:00Z'
    }
  })
}

export const setupMockComunicazioniService = () => {
  mockComunicazioniService.getComunicazioniCliente.mockResolvedValue([])
  mockComunicazioniService.createComunicazione.mockResolvedValue({
    comunicazioneId: 1,
    tipo: 'Chiamata',
    contenuto: 'Test comunicazione',
    dataOra: '2024-01-15T10:00:00Z'
  })
}
