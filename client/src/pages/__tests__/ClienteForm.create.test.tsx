import { de// Mock della navigazione
const mockNavigate = vi.fn()

// Mock dei servizi
vi.mock('../../services/clientiService', () => ({
  default: mockClientiService
}))

// Mock della navigazione con useParams per nuovo cliente
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: undefined }), // Nuovo cliente
  }
})ect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import ClienteForm from '../ClienteForm'
import { 
  mockCliente, 
  setupMockClientiService, 
  mockClientiService 
} from '../../test/mocks'

// Mock della navigazione
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: undefined }), // Default: nuovo cliente
  }
})

// Mock dei servizi
vi.mock('../services/clientiService', () => ({
  default: mockClientiService
}))

describe('ClienteForm - Creazione Nuovo Cliente', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    setupMockClientiService()
  })

  describe('Rendering del Form', () => {
    it('dovrebbe mostrare il form per nuovo cliente', () => {
      render(<ClienteForm />)

      expect(screen.getByText('Nuovo Cliente')).toBeInTheDocument()
      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cognome/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/telefono/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/consenso privacy/i)).toBeInTheDocument()
      expect(screen.getByText(/salva cliente/i)).toBeInTheDocument()
    })

    it('dovrebbe avere tutti i campi vuoti per nuovo cliente', () => {
      render(<ClienteForm />)

      expect(screen.getByLabelText(/nome/i)).toHaveValue('')
      expect(screen.getByLabelText(/cognome/i)).toHaveValue('')
      expect(screen.getByLabelText(/email/i)).toHaveValue('')
      expect(screen.getByLabelText(/telefono/i)).toHaveValue('')
      expect(screen.getByLabelText(/consenso privacy/i)).not.toBeChecked()
    })
  })

  describe('Validazione Campi', () => {
    it('dovrebbe richiedere il consenso privacy', async () => {
      render(<ClienteForm />)

      // Compila i campi obbligatori ma non il consenso privacy
      await user.type(screen.getByLabelText(/nome/i), 'Mario')
      await user.type(screen.getByLabelText(/cognome/i), 'Rossi')
      await user.type(screen.getByLabelText(/email/i), 'mario@example.com')
      await user.type(screen.getByLabelText(/telefono/i), '1234567890')

      // Tenta di salvare senza consenso privacy
      const saveButton = screen.getByText(/salva cliente/i)
      await user.click(saveButton)

      // Verifica che mostri errore e non chiami l'API
      await waitFor(() => {
        expect(screen.getByText(/consenso alla privacy è obbligatorio/i)).toBeInTheDocument()
      })
      
      expect(mockClientiService.create).not.toHaveBeenCalled()
    })

    it('dovrebbe validare il formato email', async () => {
      render(<ClienteForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'email-non-valida')

      // Verifica che il campo sia invalido
      expect(emailInput).toBeInvalid()
    })

    it('dovrebbe accettare un form valido', async () => {
      render(<ClienteForm />)

      // Compila tutti i campi richiesti
      await user.type(screen.getByLabelText(/nome/i), 'Mario')
      await user.type(screen.getByLabelText(/cognome/i), 'Rossi')
      await user.type(screen.getByLabelText(/email/i), 'mario@example.com')
      await user.type(screen.getByLabelText(/telefono/i), '1234567890')
      await user.click(screen.getByLabelText(/consenso privacy/i))

      const saveButton = screen.getByText(/salva cliente/i)
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockClientiService.create).toHaveBeenCalledWith({
          nome: 'Mario',
          cognome: 'Rossi',
          email: 'mario@example.com',
          telefono: '1234567890',
          indirizzo: '',
          citta: '',
          cap: '',
          provincia: '',
          provenienzaContatto: 'Altro',
          consensoPrivacy: true,
          consensoMarketing: false,
          note: ''
        })
      })
    })
  })

  describe('Campi Opzionali', () => {
    it('dovrebbe gestire i campi indirizzo', async () => {
      render(<ClienteForm />)

      await user.type(screen.getByLabelText(/indirizzo/i), 'Via Roma 123')
      await user.type(screen.getByLabelText(/città/i), 'Milano')
      await user.type(screen.getByLabelText(/cap/i), '20100')
      
      // Seleziona provincia
      const provinciaSelect = screen.getByLabelText(/provincia/i)
      await user.selectOptions(provinciaSelect, 'MI')

      expect(screen.getByDisplayValue('Via Roma 123')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Milano')).toBeInTheDocument()
      expect(screen.getByDisplayValue('20100')).toBeInTheDocument()
      expect(screen.getByDisplayValue('MI')).toBeInTheDocument()
    })

    it('dovrebbe gestire la provenienza contatto', async () => {
      render(<ClienteForm />)

      const provenienzaSelect = screen.getByLabelText(/provenienza contatto/i)
      await user.selectOptions(provenienzaSelect, 'Google')

      expect(screen.getByDisplayValue('Google')).toBeInTheDocument()
    })

    it('dovrebbe gestire il consenso marketing', async () => {
      render(<ClienteForm />)

      const marketingCheckbox = screen.getByLabelText(/consenso marketing/i)
      await user.click(marketingCheckbox)

      expect(marketingCheckbox).toBeChecked()
    })

    it('dovrebbe gestire le note', async () => {
      render(<ClienteForm />)

      const noteTextarea = screen.getByLabelText(/note/i)
      await user.type(noteTextarea, 'Questo è un cliente importante')

      expect(screen.getByDisplayValue('Questo è un cliente importante')).toBeInTheDocument()
    })
  })

  describe('Salvataggio Cliente', () => {
    it('dovrebbe salvare un nuovo cliente con successo', async () => {
      render(<ClienteForm />)

      // Compila form completo
      await user.type(screen.getByLabelText(/nome/i), 'Mario')
      await user.type(screen.getByLabelText(/cognome/i), 'Rossi')
      await user.type(screen.getByLabelText(/email/i), 'mario@example.com')
      await user.type(screen.getByLabelText(/telefono/i), '1234567890')
      await user.type(screen.getByLabelText(/indirizzo/i), 'Via Roma 123')
      await user.type(screen.getByLabelText(/città/i), 'Milano')
      await user.type(screen.getByLabelText(/cap/i), '20100')
      await user.selectOptions(screen.getByLabelText(/provincia/i), 'MI')
      await user.selectOptions(screen.getByLabelText(/provenienza contatto/i), 'Google')
      await user.click(screen.getByLabelText(/consenso privacy/i))
      await user.click(screen.getByLabelText(/consenso marketing/i))
      await user.type(screen.getByLabelText(/note/i), 'Cliente VIP')

      const saveButton = screen.getByText(/salva cliente/i)
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockClientiService.create).toHaveBeenCalledWith({
          nome: 'Mario',
          cognome: 'Rossi',
          email: 'mario@example.com',
          telefono: '1234567890',
          indirizzo: 'Via Roma 123',
          citta: 'Milano',
          cap: '20100',
          provincia: 'MI',
          provenienzaContatto: 'Google',
          consensoPrivacy: true,
          consensoMarketing: true,
          note: 'Cliente VIP'
        })
      })

      // Verifica messaggio di successo e navigazione
      await waitFor(() => {
        expect(screen.getByText(/cliente creato con successo/i)).toBeInTheDocument()
      })
      
      expect(mockNavigate).toHaveBeenCalledWith('/clienti')
    })

    it('dovrebbe mostrare errore se il salvataggio fallisce', async () => {
      mockClientiService.create.mockRejectedValueOnce({
        response: {
          data: { message: 'Email già esistente' },
          status: 400
        }
      })

      render(<ClienteForm />)

      // Compila form minimo
      await user.type(screen.getByLabelText(/nome/i), 'Mario')
      await user.type(screen.getByLabelText(/cognome/i), 'Rossi')
      await user.type(screen.getByLabelText(/email/i), 'mario@example.com')
      await user.type(screen.getByLabelText(/telefono/i), '1234567890')
      await user.click(screen.getByLabelText(/consenso privacy/i))

      const saveButton = screen.getByText(/salva cliente/i)
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/email già esistente/i)).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('dovrebbe disabilitare il pulsante durante il salvataggio', async () => {
      // Mock che simula un salvataggio lento
      mockClientiService.create.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(<ClienteForm />)

      // Compila form minimo
      await user.type(screen.getByLabelText(/nome/i), 'Mario')
      await user.type(screen.getByLabelText(/cognome/i), 'Rossi')
      await user.type(screen.getByLabelText(/email/i), 'mario@example.com')
      await user.type(screen.getByLabelText(/telefono/i), '1234567890')
      await user.click(screen.getByLabelText(/consenso privacy/i))

      const saveButton = screen.getByText(/salva cliente/i)
      await user.click(saveButton)

      // Verifica che il pulsante sia disabilitato
      expect(saveButton).toBeDisabled()
      expect(screen.getByText(/salvataggio/i)).toBeInTheDocument()
    })
  })

  describe('Annulla Operazione', () => {
    it('dovrebbe tornare alla lista clienti quando si clicca Annulla', async () => {
      render(<ClienteForm />)

      const cancelButton = screen.getByText(/annulla/i)
      await user.click(cancelButton)

      expect(mockNavigate).toHaveBeenCalledWith('/clienti')
    })

    it('dovrebbe chiedere conferma se ci sono modifiche non salvate', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<ClienteForm />)

      // Modifica qualcosa
      await user.type(screen.getByLabelText(/nome/i), 'Mario')

      const cancelButton = screen.getByText(/annulla/i)
      await user.click(cancelButton)

      expect(confirmSpy).toHaveBeenCalledWith(
        'Ci sono modifiche non salvate. Vuoi davvero uscire?'
      )

      confirmSpy.mockRestore()
    })
  })
})
