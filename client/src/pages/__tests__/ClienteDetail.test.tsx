import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import ClienteDetail from '../ClienteDetail'
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

// Mock della navigazione con parametro id
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  }
})

describe('ClienteDetail', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    setupMockClientiService()
  })

  describe('Caricamento Dati Cliente', () => {
    it('dovrebbe caricare e mostrare i dettagli del cliente', async () => {
      render(<ClienteDetail />)
      
      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })
    })

    it('dovrebbe mostrare loading durante il caricamento', () => {
      render(<ClienteDetail />)
      
      expect(screen.getByText('Caricamento...')).toBeInTheDocument()
    })
  })

  describe('Azioni Cliente', () => {
    it('dovrebbe mostrare i bottoni di azione', async () => {
      render(<ClienteDetail />)
      
      await waitFor(() => {
        expect(screen.getByText('Modifica Cliente')).toBeInTheDocument()
      })
    })
  })
})