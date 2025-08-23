import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import ClientiList from '../ClientiList'
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

// Mock della navigazione
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})be, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import ClientiList from '../ClientiList'
import { 
  mockClienteLista, 
  setupMockClientiService, 
  mockClientiService 
} from '../../test/mocks'

// Mock dei servizi
vi.mock('../services/clientiService', () => ({
  default: mockClientiService
}))

describe('ClientiList', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    setupMockClientiService()
  })

  describe('Visualizzazione Lista', () => {
    it('dovrebbe mostrare la lista dei clienti', async () => {
      render(<ClientiList />)

      // Verifica che il componente si carichi
      expect(screen.getByText('Gestione Clienti')).toBeInTheDocument()
      
      // Aspetta che i dati vengano caricati
      await waitFor(() => {
        expect(mockClientiService.getAll).toHaveBeenCalled()
      })

      // Verifica che i clienti siano visualizzati
      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
        expect(screen.getByText('Lucia Bianchi')).toBeInTheDocument()
        expect(screen.getByText('Giuseppe Verdi')).toBeInTheDocument()
      })
    })

    it('dovrebbe mostrare il messaggio quando non ci sono clienti', async () => {
      mockClientiService.getAll.mockResolvedValueOnce([])
      
      render(<ClientiList />)

      await waitFor(() => {
        expect(screen.getByText(/nessun cliente trovato/i)).toBeInTheDocument()
      })
    })

    it('dovrebbe mostrare lo stato di caricamento', () => {
      // Mock che non si risolve immediatamente
      mockClientiService.getAll.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(<ClientiList />)

      expect(screen.getByText(/caricamento/i)).toBeInTheDocument()
    })
  })

  describe('Funzionalità Ricerca', () => {
    it('dovrebbe permettere di cercare per nome', async () => {
      render(<ClientiList />)

      // Aspetta che i dati siano caricati
      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      // Trova il campo di ricerca
      const searchInput = screen.getByPlaceholderText(/cerca per nome/i)
      
      // Digita nel campo di ricerca
      await user.type(searchInput, 'Mario')

      // Verifica che la ricerca sia stata chiamata
      await waitFor(() => {
        expect(mockClientiService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Mario'
          })
        )
      })
    })

    it('dovrebbe permettere di cercare per email', async () => {
      render(<ClientiList />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/cerca per nome/i)
      await user.type(searchInput, 'mario.rossi@example.com')

      await waitFor(() => {
        expect(mockClientiService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'mario.rossi@example.com'
          })
        )
      })
    })

    it('dovrebbe pulire la ricerca', async () => {
      render(<ClientiList />)

      const searchInput = screen.getByPlaceholderText(/cerca per nome/i)
      await user.type(searchInput, 'Mario')
      await user.clear(searchInput)

      await waitFor(() => {
        expect(mockClientiService.getAll).toHaveBeenLastCalledWith(
          expect.objectContaining({
            search: ''
          })
        )
      })
    })
  })

  describe('Filtri', () => {
    it('dovrebbe filtrare per provenienza contatto', async () => {
      render(<ClientiList />)

      // Aspetta che i dati siano caricati
      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      // Trova e clicca il filtro provenienza
      const provenienzaSelect = screen.getByDisplayValue(/tutte le provenienze/i)
      await user.selectOptions(provenienzaSelect, 'Google')

      await waitFor(() => {
        expect(mockClientiService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            provenienzaContatto: 'Google'
          })
        )
      })
    })

    it('dovrebbe filtrare per consenso marketing', async () => {
      render(<ClientiList />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const marketingSelect = screen.getByDisplayValue(/tutti/i)
      await user.selectOptions(marketingSelect, 'true')

      await waitFor(() => {
        expect(mockClientiService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            consensoMarketing: true
          })
        )
      })
    })

    it('dovrebbe resettare i filtri', async () => {
      render(<ClientiList />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      // Applica alcuni filtri
      const provenienzaSelect = screen.getByDisplayValue(/tutte le provenienze/i)
      await user.selectOptions(provenienzaSelect, 'Google')

      // Clicca reset filtri
      const resetButton = screen.getByText(/reset filtri/i)
      await user.click(resetButton)

      await waitFor(() => {
        expect(mockClientiService.getAll).toHaveBeenLastCalledWith({})
      })
    })
  })

  describe('Azioni sui Clienti', () => {
    it('dovrebbe navigare alla pagina di dettaglio quando si clicca Visualizza', async () => {
      render(<ClientiList />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      // Trova e clicca il primo pulsante Visualizza
      const viewButtons = screen.getAllByText(/visualizza/i)
      await user.click(viewButtons[0])

      expect(mockNavigate).toHaveBeenCalledWith('/clienti/1')
    })

    it('dovrebbe navigare alla pagina di modifica quando si clicca Modifica', async () => {
      render(<ClientiList />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByText(/modifica/i)
      await user.click(editButtons[0])

      expect(mockNavigate).toHaveBeenCalledWith('/clienti/1/modifica')
    })

    it('dovrebbe eliminare un cliente quando confermato', async () => {
      // Mock di window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<ClientiList />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText(/elimina/i)
      await user.click(deleteButtons[0])

      expect(confirmSpy).toHaveBeenCalledWith(
        'Sei sicuro di voler eliminare questo cliente?'
      )
      
      await waitFor(() => {
        expect(mockClientiService.delete).toHaveBeenCalledWith(1)
      })

      confirmSpy.mockRestore()
    })

    it('NON dovrebbe eliminare un cliente se non confermato', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<ClientiList />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText(/elimina/i)
      await user.click(deleteButtons[0])

      expect(mockClientiService.delete).not.toHaveBeenCalled()

      confirmSpy.mockRestore()
    })
  })

  describe('Ordinamento', () => {
    it('dovrebbe ordinare per cognome ascendente per default', async () => {
      render(<ClientiList />)

      await waitFor(() => {
        expect(mockClientiService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'cognome',
            sortOrder: 'ASC'
          })
        )
      })
    })

    it('dovrebbe cambiare ordinamento quando si clicca sull\'header della tabella', async () => {
      render(<ClientiList />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      // Clicca sull'header "Nome"
      const nomeHeader = screen.getByText('Nome')
      await user.click(nomeHeader)

      await waitFor(() => {
        expect(mockClientiService.getAll).toHaveBeenLastCalledWith(
          expect.objectContaining({
            sortBy: 'nome',
            sortOrder: 'ASC'
          })
        )
      })
    })
  })

  describe('Paginazione', () => {
    it('dovrebbe gestire la paginazione', async () => {
      // Mock con molti clienti per testare paginazione
      const manyClients = Array.from({ length: 50 }, (_, i) => ({
        ...mockClienteLista[0],
        clienteId: i + 1,
        nome: `Cliente ${i + 1}`,
      }))

      mockClientiService.getAll.mockResolvedValueOnce(manyClients)

      render(<ClientiList />)

      await waitFor(() => {
        expect(screen.getByText('Cliente 1')).toBeInTheDocument()
      })

      // Verifica che ci siano controlli di paginazione
      expect(screen.getByText(/pagina/i)).toBeInTheDocument()
    })
  })

  describe('Bottone Nuovo Cliente', () => {
    it('dovrebbe navigare alla pagina di creazione nuovo cliente', async () => {
      render(<ClientiList />)

      const newClientButton = screen.getByText(/nuovo cliente/i)
      await user.click(newClientButton)

      expect(mockNavigate).toHaveBeenCalledWith('/clienti/nuovo')
    })
  })
})
