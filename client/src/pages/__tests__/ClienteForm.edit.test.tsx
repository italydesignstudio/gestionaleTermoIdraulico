import { describe, it, expect, beforeEach, vi } from 'vitest'
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

// Mock dei servizi
vi.mock('../../services/clientiService', () => ({
  default: mockClientiService
}))

// Mock della navigazione con useParams per modifica cliente
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }), // Modifica cliente esistente
  }
})

describe('ClienteForm - Modifica Cliente Esistente', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    setupMockClientiService()
  })

  describe('Caricamento Dati Esistenti', () => {
  it('dovrebbe caricare i dati del cliente esistente', async () => {
    // Mock della chiamata API per ottenere il cliente
    vi.mocked(useParams).mockReturnValue({ id: '1' })
    const mockClient = mockClienteLista[0]
    mockClientiService.getById.mockResolvedValue(mockClient)

    const component = render(<ClienteForm />)
    
    // Aspetta che i dati vengano caricati
    await waitFor(() => {
      const nomeInput = component.getByDisplayValue('Mario Rossi')
      expect(nomeInput).toBeInTheDocument()
    })
    
    const emailInput = component.getByDisplayValue('mario.rossi@email.com')
    expect(emailInput).toBeInTheDocument()
  })

  it('dovrebbe mostrare loading durante il caricamento', () => {
      // Mock che simula caricamento lento
      mockClientiService.getById.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(<ClienteForm />)

      expect(screen.getByText(/caricamento/i)).toBeInTheDocument()
    })

    it('dovrebbe gestire errore nel caricamento dati', async () => {
      mockClientiService.getById.mockRejectedValueOnce(new Error('Cliente non trovato'))

      render(<ClienteForm />)

      await waitFor(() => {
        expect(screen.getByText(/errore nel caricamento/i)).toBeInTheDocument()
      })

      expect(mockNavigate).toHaveBeenCalledWith('/clienti')
    })

    it('dovrebbe gestire ID non valido', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ id: 'abc' })

      render(<ClienteForm />)

      await waitFor(() => {
        expect(screen.getByText(/id cliente non valido/i)).toBeInTheDocument()
      })

      expect(mockNavigate).toHaveBeenCalledWith('/clienti')
    })
  })

  describe('Modifica Dati', () => {
    it('dovrebbe permettere di modificare tutti i campi', async () => {
      render(<ClienteForm />)

      // Aspetta che i dati siano caricati
      await waitFor(() => {
        expect(screen.getByDisplayValue('Mario')).toBeInTheDocument()
      })

      // Modifica i campi
      const nomeInput = screen.getByDisplayValue('Mario')
      await user.clear(nomeInput)
      await user.type(nomeInput, 'Giuseppe')

      const emailInput = screen.getByDisplayValue('mario.rossi@example.com')
      await user.clear(emailInput)
      await user.type(emailInput, 'giuseppe.rossi@example.com')

      const telefonoInput = screen.getByDisplayValue('+39 123 456 789')
      await user.clear(telefonoInput)
      await user.type(telefonoInput, '0987654321')

      // Verifica che i valori siano aggiornati
      expect(screen.getByDisplayValue('Giuseppe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('giuseppe.rossi@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('0987654321')).toBeInTheDocument()
    })

    it('dovrebbe permettere di modificare checkbox', async () => {
      render(<ClienteForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/consenso privacy/i)).toBeChecked()
      })

      // Toglie consenso marketing
      const marketingCheckbox = screen.getByLabelText(/consenso marketing/i)
      await user.click(marketingCheckbox)

      expect(marketingCheckbox).toBeChecked()
    })

    it('dovrebbe permettere di modificare select', async () => {
      render(<ClienteForm />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Google')).toBeInTheDocument()
      })

      const provenienzaSelect = screen.getByDisplayValue('Google')
      await user.selectOptions(provenienzaSelect, 'Facebook')

      expect(screen.getByDisplayValue('Facebook')).toBeInTheDocument()
    })
  })

  describe('Salvataggio Modifiche', () => {
    it('dovrebbe salvare le modifiche con successo', async () => {
      render(<ClienteForm />)

      // Aspetta che i dati siano caricati
      await waitFor(() => {
        expect(screen.getByDisplayValue('Mario')).toBeInTheDocument()
      })

      // Modifica qualche campo
      const nomeInput = screen.getByDisplayValue('Mario')
      await user.clear(nomeInput)
      await user.type(nomeInput, 'Giuseppe')

      const saveButton = screen.getByText(/salva cliente/i)
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockClientiService.update).toHaveBeenCalledWith(1, {
          nome: 'Giuseppe',
          cognome: 'Rossi',
          email: 'mario.rossi@example.com',
          telefono: '+39 123 456 789',
          indirizzo: 'Via Roma 123',
          citta: 'Milano',
          cap: '20100',
          provincia: 'MI',
          provenienzaContatto: 'Google',
          consensoPrivacy: true,
          consensoMarketing: false,
          note: 'Cliente di prova'
        })
      })

      // Verifica messaggio successo e navigazione
      await waitFor(() => {
        expect(screen.getByText(/cliente aggiornato con successo/i)).toBeInTheDocument()
      })

      expect(mockNavigate).toHaveBeenCalledWith('/clienti')
    })

    it('dovrebbe gestire errori durante il salvataggio', async () => {
      mockClientiService.update.mockRejectedValueOnce({
        response: {
          data: { message: 'Email già utilizzata da altro cliente' },
          status: 400
        }
      })

      render(<ClienteForm />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Mario')).toBeInTheDocument()
      })

      const saveButton = screen.getByText(/salva cliente/i)
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/email già utilizzata da altro cliente/i)).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('dovrebbe validare anche in modalità modifica', async () => {
      render(<ClienteForm />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Mario')).toBeInTheDocument()
      })

      // Rimuove consenso privacy
      const privacyCheckbox = screen.getByLabelText(/consenso privacy/i)
      await user.click(privacyCheckbox)

      const saveButton = screen.getByText(/salva cliente/i)
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/consenso alla privacy è obbligatorio/i)).toBeInTheDocument()
      })

      expect(mockClientiService.update).not.toHaveBeenCalled()
    })
  })

  describe('Confronto Modifiche', () => {
    it('dovrebbe riconoscere quando non ci sono modifiche', async () => {
      render(<ClienteForm />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Mario')).toBeInTheDocument()
      })

      // Salva senza modifiche
      const saveButton = screen.getByText(/salva cliente/i)
      await user.click(saveButton)

      // Dovrebbe comunque salvare (anche se uguale)
      await waitFor(() => {
        expect(mockClientiService.update).toHaveBeenCalled()
      })
    })

    it('dovrebbe riconoscere quando ci sono modifiche', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<ClienteForm />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Mario')).toBeInTheDocument()
      })

      // Modifica qualcosa
      const nomeInput = screen.getByDisplayValue('Mario')
      await user.clear(nomeInput)
      await user.type(nomeInput, 'Giuseppe')

      // Tenta di annullare
      const cancelButton = screen.getByText(/annulla/i)
      await user.click(cancelButton)

      expect(confirmSpy).toHaveBeenCalledWith(
        'Ci sono modifiche non salvate. Vuoi davvero uscire?'
      )

      confirmSpy.mockRestore()
    })
  })

  describe('Stati di Caricamento', () => {
    it('dovrebbe disabilitare il form durante il caricamento', () => {
      mockClientiService.getById.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(<ClienteForm />)

      expect(screen.getByText(/caricamento/i)).toBeInTheDocument()
      // Il form non dovrebbe essere visibile durante il caricamento
      expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument()
    })

    it('dovrebbe disabilitare il pulsante salva durante il salvataggio', async () => {
      mockClientiService.update.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(<ClienteForm />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Mario')).toBeInTheDocument()
      })

      const saveButton = screen.getByText(/salva cliente/i)
      await user.click(saveButton)

      expect(saveButton).toBeDisabled()
      expect(screen.getByText(/salvataggio/i)).toBeInTheDocument()
    })
  })
})
