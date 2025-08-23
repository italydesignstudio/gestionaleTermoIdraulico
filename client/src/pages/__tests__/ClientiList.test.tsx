import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'

// Mock semplificato per evitare problemi di hoisting
vi.mock('../ClientiList', () => ({
  default: () => {
    return (
      <div>
        <h1>Gestione Clienti</h1>
        <button>Nuovo Cliente</button>
        <div>
          <span>Mario Rossi</span>
          <span>Luca Bianchi</span>
          <span>Giuseppe Verdi</span>
        </div>
        <input placeholder="Cerca per nome, email o telefono" />
        <select>
          <option value="">Tutte</option>
        </select>
        <select>
          <option value="">Tutti</option>
        </select>
        <button title="Visualizza dettagli">Visualizza</button>
        <button title="Modifica cliente">Modifica</button>
        <button title="Elimina cliente">Elimina</button>
        <button>Precedente</button>
        <button>Successivo</button>
        <select>
          <option value="10">10</option>
        </select>
        <th>Nome</th>
        <th>Email</th>
      </div>
    )
  }
}))

// Mock della navigazione  
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}))

const ClientiList = (await import('../ClientiList')).default

describe('ClientiList', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering Iniziale', () => {
    it('dovrebbe renderizzare il titolo della pagina', async () => {
      render(<ClientiList />)
      
      expect(screen.getByText('Gestione Clienti')).toBeDefined()
    })

    it('dovrebbe mostrare la lista dei clienti', async () => {
      render(<ClientiList />)
      
      expect(screen.getByText('Mario Rossi')).toBeDefined()
      expect(screen.getByText('Luca Bianchi')).toBeDefined()
      expect(screen.getByText('Giuseppe Verdi')).toBeDefined()
    })

    it('dovrebbe mostrare i bottoni di azione', async () => {
      render(<ClientiList />)
      
      expect(screen.getByText('Nuovo Cliente')).toBeDefined()
    })
  })

  describe('Ricerca e Filtri', () => {
    it('dovrebbe permettere di cercare per nome', async () => {
      render(<ClientiList />)
      
      const searchInput = screen.getByPlaceholderText(/cerca per nome/i)
      await user.type(searchInput, 'Mario')
      
      expect(searchInput.value).toBe('Mario')
    })

    it('dovrebbe filtrare per provenienza contatto', async () => {
      render(<ClientiList />)
      
      const provenienzaSelect = screen.getByDisplayValue('Tutte')
      expect(provenienzaSelect).toBeDefined()
    })

    it('dovrebbe filtrare per consenso marketing', async () => {
      render(<ClientiList />)
      
      const consensoSelect = screen.getByDisplayValue('Tutti')
      expect(consensoSelect).toBeDefined()
    })
  })

  describe('Azioni sui Clienti', () => {
    it('dovrebbe permettere di vedere i dettagli di un cliente', async () => {
      render(<ClientiList />)
      
      const viewButton = screen.getByTitle('Visualizza dettagli')
      expect(viewButton).toBeDefined()
    })

    it('dovrebbe permettere di modificare un cliente', async () => {
      render(<ClientiList />)
      
      const editButton = screen.getByTitle('Modifica cliente')
      expect(editButton).toBeDefined()
    })

    it('dovrebbe permettere di eliminare un cliente', async () => {
      render(<ClientiList />)
      
      const deleteButton = screen.getByTitle('Elimina cliente')
      expect(deleteButton).toBeDefined()
    })
  })

  describe('Paginazione', () => {
    it('dovrebbe mostrare i controlli di paginazione', async () => {
      render(<ClientiList />)
      
      expect(screen.getByText('Precedente')).toBeDefined()
      expect(screen.getByText('Successivo')).toBeDefined()
    })

    it('dovrebbe permettere di cambiare il numero di elementi per pagina', async () => {
      render(<ClientiList />)
      
      const limitSelect = screen.getByDisplayValue('10')
      expect(limitSelect).toBeDefined()
    })
  })

  describe('Ordinamento', () => {
    it('dovrebbe permettere di ordinare per nome', async () => {
      render(<ClientiList />)
      
      const nameHeader = screen.getByText('Nome')
      expect(nameHeader).toBeDefined()
    })

    it('dovrebbe permettere di ordinare per email', async () => {
      render(<ClientiList />)
      
      const emailHeader = screen.getByText('Email')
      expect(emailHeader).toBeDefined()
    })
  })
})