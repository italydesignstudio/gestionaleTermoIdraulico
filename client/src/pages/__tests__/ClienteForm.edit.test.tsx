import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import ClienteForm from '../ClienteForm'
import { 
  mockClienteLista,
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
      render(<ClienteForm />)
      
      // Aspetta che i dati vengano caricati
      await waitFor(() => {
        const nomeInput = screen.getByDisplayValue('Mario Rossi')
        expect(nomeInput).toBeInTheDocument()
      })
      
      const emailInput = screen.getByDisplayValue('mario.rossi@email.com')
      expect(emailInput).toBeInTheDocument()
    })

    it('dovrebbe mostrare loading durante il caricamento', () => {
      render(<ClienteForm />)
      
      expect(screen.getByText('Caricamento...')).toBeInTheDocument()
    })

    it('dovrebbe mostrare il titolo per modifica', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        expect(screen.getByText('Modifica Cliente')).toBeInTheDocument()
      })
    })

    it('dovrebbe pre-compilare tutti i campi', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Mario Rossi')).toBeInTheDocument()
        expect(screen.getByDisplayValue('mario.rossi@email.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Via Roma 123')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Milano')).toBeInTheDocument()
        expect(screen.getByDisplayValue('20100')).toBeInTheDocument()
      })
    })
  })

  describe('Modifica Dati', () => {
    it('dovrebbe permettere di modificare il nome', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const nomeInput = screen.getByDisplayValue('Mario Rossi')
        expect(nomeInput).toBeInTheDocument()
      })
      
      const nomeInput = screen.getByDisplayValue('Mario Rossi')
      await user.clear(nomeInput)
      await user.type(nomeInput, 'Mario Modificato')
      
      expect(nomeInput).toHaveValue('Mario Modificato')
    })

    it('dovrebbe permettere di modificare l\'email', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('mario.rossi@email.com')
        expect(emailInput).toBeInTheDocument()
      })
      
      const emailInput = screen.getByDisplayValue('mario.rossi@email.com')
      await user.clear(emailInput)
      await user.type(emailInput, 'mario.modificato@email.com')
      
      expect(emailInput).toHaveValue('mario.modificato@email.com')
    })

    it('dovrebbe permettere di modificare il telefono', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const telInput = screen.getByDisplayValue('1234567890')
        expect(telInput).toBeInTheDocument()
      })
      
      const telInput = screen.getByDisplayValue('1234567890')
      await user.clear(telInput)
      await user.type(telInput, '0987654321')
      
      expect(telInput).toHaveValue('0987654321')
    })

    it('dovrebbe permettere di modificare la provenienza contatto', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const provenienzaSelect = screen.getByDisplayValue('Cliente esistente')
        expect(provenienzaSelect).toBeInTheDocument()
      })
      
      const provenienzaSelect = screen.getByDisplayValue('Cliente esistente')
      await user.selectOptions(provenienzaSelect, 'Facebook')
      
      expect(provenienzaSelect).toHaveValue('Facebook')
    })
  })

  describe('Validazione Durante Modifica', () => {
    it('dovrebbe validare campi obbligatori durante modifica', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const nomeInput = screen.getByDisplayValue('Mario Rossi')
        expect(nomeInput).toBeInTheDocument()
      })
      
      const nomeInput = screen.getByDisplayValue('Mario Rossi')
      await user.clear(nomeInput)
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Nome è obbligatorio')).toBeInTheDocument()
      })
    })

    it('dovrebbe validare formato email durante modifica', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('mario.rossi@email.com')
        expect(emailInput).toBeInTheDocument()
      })
      
      const emailInput = screen.getByDisplayValue('mario.rossi@email.com')
      await user.clear(emailInput)
      await user.type(emailInput, 'email-non-valida')
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Email non valida')).toBeInTheDocument()
      })
    })
  })

  describe('Salvataggio Modifiche', () => {
    it('dovrebbe salvare le modifiche del cliente', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const nomeInput = screen.getByDisplayValue('Mario Rossi')
        expect(nomeInput).toBeInTheDocument()
      })
      
      // Modifica il nome
      const nomeInput = screen.getByDisplayValue('Mario Rossi')
      await user.clear(nomeInput)
      await user.type(nomeInput, 'Mario Modificato')
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      // Verifica che il servizio sia stato chiamato con i dati modificati
      await waitFor(() => {
        expect(mockClientiService.update).toHaveBeenCalledWith(1, expect.objectContaining({
          nome: 'Mario Modificato'
        }))
      })
    })

    it('dovrebbe mostrare messaggio di successo dopo salvataggio', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const nomeInput = screen.getByDisplayValue('Mario Rossi')
        expect(nomeInput).toBeInTheDocument()
      })
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Cliente aggiornato con successo')).toBeInTheDocument()
      })
    })

    it('dovrebbe navigare ai dettagli dopo salvataggio', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const nomeInput = screen.getByDisplayValue('Mario Rossi')
        expect(nomeInput).toBeInTheDocument()
      })
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/clienti/1')
      })
    })
  })

  describe('Gestione Errori', () => {
    it('dovrebbe gestire errori durante il caricamento', async () => {
      mockClientiService.getById.mockRejectedValue(new Error('Cliente non trovato'))
      
      render(<ClienteForm />)
      
      await waitFor(() => {
        expect(screen.getByText('Errore nel caricamento dei dati del cliente')).toBeInTheDocument()
      })
    })

    it('dovrebbe gestire errori durante il salvataggio', async () => {
      mockClientiService.update.mockRejectedValue(new Error('Errore del server'))
      
      render(<ClienteForm />)
      
      await waitFor(() => {
        const nomeInput = screen.getByDisplayValue('Mario Rossi')
        expect(nomeInput).toBeInTheDocument()
      })
      
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Errore durante il salvataggio')).toBeInTheDocument()
      })
    })
  })

  describe('Navigazione', () => {
    it('dovrebbe permettere di annullare e tornare ai dettagli', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Annulla')
        expect(cancelButton).toBeInTheDocument()
      })
      
      const cancelButton = screen.getByText('Annulla')
      await user.click(cancelButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/clienti/1')
    })
  })

  describe('Confronto Modifiche', () => {
    it('dovrebbe rilevare quando ci sono modifiche non salvate', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const nomeInput = screen.getByDisplayValue('Mario Rossi')
        expect(nomeInput).toBeInTheDocument()
      })
      
      // Modifica un campo
      const nomeInput = screen.getByDisplayValue('Mario Rossi')
      await user.clear(nomeInput)
      await user.type(nomeInput, 'Mario Modificato')
      
      // Il bottone Salva dovrebbe essere abilitato
      const saveButton = screen.getByText('Salva')
      expect(saveButton).not.toBeDisabled()
    })

    it('dovrebbe mantenere i dati originali se non ci sono modifiche', async () => {
      render(<ClienteForm />)
      
      await waitFor(() => {
        const nomeInput = screen.getByDisplayValue('Mario Rossi')
        expect(nomeInput).toBeInTheDocument()
      })
      
      // Salva senza modifiche
      const saveButton = screen.getByText('Salva')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockClientiService.update).toHaveBeenCalledWith(1, expect.objectContaining({
          nome: 'Mario Rossi',
          email: 'mario.rossi@email.com'
        }))
      })
    })
  })
})
