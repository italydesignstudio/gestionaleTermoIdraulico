import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import ClienteDetail from '../ClienteDetail'
import { 
  mockCliente, 
  setupMockClientiService, 
  setupMockDocumentiService,
  setupMockComunicazioniService,
  mockClientiService,
  mockDocumentiService,
  mockComunicazioniService
} from '../../test/mocks'

// Mock della navigazione
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  }
})

// Mock dei servizi
vi.mock('../../services/clientiService', () => ({
  default: mockClientiService
}))

vi.mock('../../services/documentiService', () => ({
  default: mockDocumentiService
}))

vi.mock('../../services/comunicazioniService', () => ({
  comunicazioniService: mockComunicazioniService
}))

describe('ClienteDetail', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    setupMockClientiService()
    setupMockDocumentiService()
    setupMockComunicazioniService()
  })

  describe('Caricamento Dati Cliente', () => {
    it('dovrebbe caricare e mostrare i dati del cliente', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(mockClientiService.getById).toHaveBeenCalledWith(1)
      })

      // Verifica che i dati del cliente siano mostrati
      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
        expect(screen.getByText('mario.rossi@example.com')).toBeInTheDocument()
        expect(screen.getByText('+39 123 456 789')).toBeInTheDocument()
        expect(screen.getByText('Via Roma 123')).toBeInTheDocument()
        expect(screen.getByText('Milano, MI 20100')).toBeInTheDocument()
        expect(screen.getByText('Google')).toBeInTheDocument()
      })
    })

    it('dovrebbe mostrare loading durante il caricamento', () => {
      mockClientiService.getById.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      render(<ClienteDetail />)

      expect(screen.getByText(/caricamento/i)).toBeInTheDocument()
    })

    it('dovrebbe gestire errore nel caricamento', async () => {
      mockClientiService.getById.mockRejectedValueOnce(new Error('Cliente non trovato'))

      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText(/errore nel caricamento/i)).toBeInTheDocument()
      })

      expect(mockNavigate).toHaveBeenCalledWith('/clienti')
    })

    it('dovrebbe gestire ID non valido', async () => {
      const { useParams } = await import('react-router-dom')
      vi.mocked(useParams).mockReturnValue({ id: 'abc' })

      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText(/id cliente non valido/i)).toBeInTheDocument()
      })

      expect(mockNavigate).toHaveBeenCalledWith('/clienti')
    })
  })

  describe('Navigazione Tabs', () => {
    it('dovrebbe mostrare il tab Anagrafica per default', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      // Verifica che il tab Anagrafica sia attivo
      expect(screen.getByRole('tab', { name: /anagrafica/i })).toHaveAttribute('aria-selected', 'true')
      
      // Verifica che i dati anagrafici siano visibili
      expect(screen.getByText('mario.rossi@example.com')).toBeInTheDocument()
    })

    it('dovrebbe permettere di navigare al tab Documenti', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      // Clicca sul tab Documenti
      const documentiTab = screen.getByRole('tab', { name: /documenti/i })
      await user.click(documentiTab)

      expect(documentiTab).toHaveAttribute('aria-selected', 'true')
      
      // Verifica che carichi i documenti
      await waitFor(() => {
        expect(mockDocumentiService.getDocumentiCliente).toHaveBeenCalledWith(1)
      })
    })

    it('dovrebbe permettere di navigare al tab Comunicazioni', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const comunicazioniTab = screen.getByRole('tab', { name: /comunicazioni/i })
      await user.click(comunicazioniTab)

      expect(comunicazioniTab).toHaveAttribute('aria-selected', 'true')
      
      await waitFor(() => {
        expect(mockComunicazioniService.getComunicazioniCliente).toHaveBeenCalledWith(1)
      })
    })

    it('dovrebbe permettere di navigare al tab Password', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const passwordTab = screen.getByRole('tab', { name: /password/i })
      await user.click(passwordTab)

      expect(passwordTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('Azioni Cliente', () => {
    it('dovrebbe navigare alla modifica cliente', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const editButton = screen.getByText(/modifica cliente/i)
      await user.click(editButton)

      expect(mockNavigate).toHaveBeenCalledWith('/clienti/1/modifica')
    })

    it('dovrebbe tornare alla lista clienti', async () => {
      render(<ClienteDetail />)

      const backButton = screen.getByText(/torna alla lista/i)
      await user.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/clienti')
    })

    it('dovrebbe eliminare il cliente quando confermato', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText(/elimina cliente/i)
      await user.click(deleteButton)

      expect(confirmSpy).toHaveBeenCalledWith(
        'Sei sicuro di voler eliminare questo cliente?'
      )

      await waitFor(() => {
        expect(mockClientiService.delete).toHaveBeenCalledWith(1)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/clienti')

      confirmSpy.mockRestore()
    })

    it('NON dovrebbe eliminare il cliente se non confermato', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const deleteButton = screen.getByText(/elimina cliente/i)
      await user.click(deleteButton)

      expect(mockClientiService.delete).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()

      confirmSpy.mockRestore()
    })
  })

  describe('Tab Documenti', () => {
    it('dovrebbe mostrare messaggio quando non ci sono documenti', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const documentiTab = screen.getByRole('tab', { name: /documenti/i })
      await user.click(documentiTab)

      await waitFor(() => {
        expect(screen.getByText(/nessun documento presente/i)).toBeInTheDocument()
      })
    })

    it('dovrebbe permettere di caricare un nuovo documento', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const documentiTab = screen.getByRole('tab', { name: /documenti/i })
      await user.click(documentiTab)

      await waitFor(() => {
        expect(screen.getByText(/carica documento/i)).toBeInTheDocument()
      })
    })
  })

  describe('Tab Comunicazioni', () => {
    it('dovrebbe mostrare messaggio quando non ci sono comunicazioni', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const comunicazioniTab = screen.getByRole('tab', { name: /comunicazioni/i })
      await user.click(comunicazioniTab)

      await waitFor(() => {
        expect(screen.getByText(/nessuna comunicazione presente/i)).toBeInTheDocument()
      })
    })

    it('dovrebbe permettere di aggiungere una nuova comunicazione', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const comunicazioniTab = screen.getByRole('tab', { name: /comunicazioni/i })
      await user.click(comunicazioniTab)

      await waitFor(() => {
        expect(screen.getByText(/nuova comunicazione/i)).toBeInTheDocument()
      })
    })
  })

  describe('Informazioni Aggiuntive', () => {
    it('dovrebbe mostrare le date di creazione e modifica', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      // Verifica che mostri informazioni sulla creazione
      expect(screen.getByText(/creato il/i)).toBeInTheDocument()
      expect(screen.getByText(/modificato il/i)).toBeInTheDocument()
    })

    it('dovrebbe mostrare i consensi', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      expect(screen.getByText(/consenso privacy/i)).toBeInTheDocument()
      expect(screen.getByText(/consenso marketing/i)).toBeInTheDocument()
    })

    it('dovrebbe mostrare le note se presenti', async () => {
      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      expect(screen.getByText('Cliente di prova')).toBeInTheDocument()
    })
  })

  describe('Responsività', () => {
    it('dovrebbe adattarsi su dispositivi mobili', async () => {
      // Simula schermo mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<ClienteDetail />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      // Verifica che i tab siano ancora accessibili
      expect(screen.getByRole('tab', { name: /anagrafica/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /documenti/i })).toBeInTheDocument()
    })
  })
})
