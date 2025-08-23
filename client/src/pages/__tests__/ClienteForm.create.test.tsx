import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import ClienteForm from '../ClienteForm'
import { 
  setupMockClientiService, 
  mockClientiService 
} from '../../test/mocks'

// Mock della navigazione
const mockNavigate = vi.fn()

// Mock dei servizi
vi.mock('../../services/clientiService', () => ({
  default: mockClientiService
}))

// Mock della navigazione per nuovo cliente (senza id)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}), // Nessun parametro = nuovo cliente
  }
})

describe('ClienteForm - Creazione Nuovo Cliente', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    setupMockClientiService()
  })

  describe('Rendering Form Nuovo Cliente', () => {
    it('dovrebbe renderizzare il form per nuovo cliente', () => {
      render(<ClienteForm />)
      
      expect(screen.getByText('Nuovo Cliente')).toBeInTheDocument()
      expect(screen.getByLabelText('Nome *')).toBeInTheDocument()
      expect(screen.getByLabelText('Cognome *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email *')).toBeInTheDocument()
    })

    it('dovrebbe mostrare tutti i campi del form', () => {
      render(<ClienteForm />)
      
      expect(screen.getByLabelText('Nome *')).toBeInTheDocument()
      expect(screen.getByLabelText('Cognome *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email *')).toBeInTheDocument()
      expect(screen.getByLabelText('Telefono')).toBeInTheDocument()
      expect(screen.getByLabelText('Indirizzo')).toBeInTheDocument()
      expect(screen.getByLabelText('Città')).toBeInTheDocument()
      expect(screen.getByLabelText('CAP')).toBeInTheDocument()
      expect(screen.getByLabelText('Provenienza Contatto')).toBeInTheDocument()
      expect(screen.getByLabelText('Consenso Marketing')).toBeInTheDocument()
    })

    it('dovrebbe mostrare i bottoni di azione', () => {
      render(<ClienteForm />)
      
      expect(screen.getByText('Salva')).toBeInTheDocument()
      expect(screen.getByText('Annulla')).toBeInTheDocument()
    })
  })

  describe('Validazione Form', () => {
    it('dovrebbe mostrare errori per campi obbligatori', async () => {
      render(<ClienteForm />)
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      // Verifica errori di validazione
      await waitFor(() => {
        expect(screen.getByText('Nome è obbligatorio')).toBeInTheDocument()
      })
    })

    it('dovrebbe validare il formato email', async () => {
      render(<ClienteForm />)
      
      const emailInput = screen.getByLabelText('Email *')
      await user.type(emailInput, 'email-non-valida')
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Email non valida')).toBeInTheDocument()
      })
    })

    it('dovrebbe validare la lunghezza minima dei campi', async () => {
      render(<ClienteForm />)
      
      const nomeInput = screen.getByLabelText('Nome *')
      await user.type(nomeInput, 'A')
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Nome deve essere di almeno 2 caratteri')).toBeInTheDocument()
      })
    })
  })

  describe('Interazioni Form', () => {
    it('dovrebbe permettere di inserire dati nei campi', async () => {
      render(<ClienteForm />)
      
      const nomeInput = screen.getByLabelText('Nome *')
      const cognomeInput = screen.getByLabelText('Cognome *')
      const emailInput = screen.getByLabelText('Email *')
      
      await user.type(nomeInput, 'Mario')
      await user.type(cognomeInput, 'Rossi')
      await user.type(emailInput, 'mario.rossi@email.com')
      
      expect(nomeInput).toHaveValue('Mario')
      expect(cognomeInput).toHaveValue('Rossi')
      expect(emailInput).toHaveValue('mario.rossi@email.com')
    })

    it('dovrebbe permettere di selezionare la provenienza contatto', async () => {
      render(<ClienteForm />)
      
      const provenienzaSelect = screen.getByLabelText('Provenienza Contatto')
      await user.selectOptions(provenienzaSelect, 'Facebook')
      
      expect(provenienzaSelect).toHaveValue('Facebook')
    })

    it('dovrebbe permettere di selezionare il consenso marketing', async () => {
      render(<ClienteForm />)
      
      const consensoSelect = screen.getByLabelText('Consenso Marketing')
      await user.selectOptions(consensoSelect, 'true')
      
      expect(consensoSelect).toHaveValue('true')
    })
  })

  describe('Salvataggio Cliente', () => {
    it('dovrebbe salvare un nuovo cliente con dati validi', async () => {
      render(<ClienteForm />)
      
      // Compila il form
      await user.type(screen.getByLabelText('Nome *'), 'Mario')
      await user.type(screen.getByLabelText('Cognome *'), 'Rossi')
      await user.type(screen.getByLabelText('Email *'), 'mario.rossi@email.com')
      await user.type(screen.getByLabelText('Telefono'), '1234567890')
      await user.selectOptions(screen.getByLabelText('Provenienza Contatto'), 'Facebook')
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      // Verifica che il servizio sia stato chiamato
      await waitFor(() => {
        expect(mockClientiService.create).toHaveBeenCalledWith({
          nome: 'Mario',
          cognome: 'Rossi',
          email: 'mario.rossi@email.com',
          telefono: '1234567890',
          indirizzo: '',
          citta: '',
          cap: '',
          provenienzaContatto: 'Facebook',
          consensoMarketing: false,
          note: ''
        })
      })
    })

    it('dovrebbe mostrare messaggio di successo dopo il salvataggio', async () => {
      render(<ClienteForm />)
      
      // Compila il form con dati minimi
      await user.type(screen.getByLabelText('Nome *'), 'Mario')
      await user.type(screen.getByLabelText('Cognome *'), 'Rossi')
      await user.type(screen.getByLabelText('Email *'), 'mario.rossi@email.com')
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      // Verifica messaggio di successo
      await waitFor(() => {
        expect(screen.getByText('Cliente creato con successo')).toBeInTheDocument()
      })
    })

    it('dovrebbe navigare alla lista clienti dopo il salvataggio', async () => {
      render(<ClienteForm />)
      
      // Compila il form
      await user.type(screen.getByLabelText('Nome *'), 'Mario')
      await user.type(screen.getByLabelText('Cognome *'), 'Rossi')
      await user.type(screen.getByLabelText('Email *'), 'mario.rossi@email.com')
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      // Verifica navigazione
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/clienti')
      })
    })
  })

  describe('Gestione Errori', () => {
    it('dovrebbe gestire errori del server', async () => {
      mockClientiService.create.mockRejectedValue(new Error('Errore del server'))
      
      render(<ClienteForm />)
      
      // Compila il form
      await user.type(screen.getByLabelText('Nome *'), 'Mario')
      await user.type(screen.getByLabelText('Cognome *'), 'Rossi')
      await user.type(screen.getByLabelText('Email *'), 'mario.rossi@email.com')
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      // Verifica messaggio di errore
      await waitFor(() => {
        expect(screen.getByText('Errore durante il salvataggio')).toBeInTheDocument()
      })
    })
  })

  describe('Navigazione', () => {
    it('dovrebbe permettere di annullare e tornare alla lista', async () => {
      render(<ClienteForm />)
      
      const cancelButton = screen.getByText('Annulla')
      await user.click(cancelButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/clienti')
    })
  })
})