import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import ClienteForm from '../ClienteForm'

// Mock del servizio clienti
vi.mock('../../services/clientiService', () => ({
  default: {
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
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({})
  }
})

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  ToastContainer: () => null,
}))

describe('ClienteForm - Creazione Nuovo Cliente', () => {
  const user = userEvent.setup()

  beforeEach(async () => {
    vi.clearAllMocks()
    // Importa il mock del servizio
    const clientiService = await import('../../services/clientiService')
    // Setup dei mock
    vi.mocked(clientiService.default.create).mockResolvedValue({ 
      message: 'Cliente creato con successo',
      clienteId: 99
    })
  })

  it('dovrebbe inviare i dati del cliente con codice fiscale', async () => {
    render(<ClienteForm />)

    await user.type(screen.getByLabelText('Nome *'), 'Mario')
    await user.type(screen.getByLabelText('Cognome *'), 'Rossi')
    await user.type(screen.getByLabelText('Codice Fiscale *'), 'RSSMRA80A01H501U')
    await user.type(screen.getByLabelText('Telefono'), '1234567890')
    
    // Clicca il consenso privacy (obbligatorio)
    await user.click(screen.getByLabelText('Consenso Privacy *'))

    const saveButton = screen.getByRole('button', { name: /Crea Cliente/ })
    await user.click(saveButton)

    await waitFor(async () => {
      const clientiService = await import('../../services/clientiService')
      expect(vi.mocked(clientiService.default.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Mario',
          cognome: 'Rossi',
          codiceFiscale: 'RSSMRA80A01H501U',
          telefono: '1234567890',
          consensoPrivacy: true
        })
      )
    })
  })

  it('dovrebbe validare il formato email se presente', async () => {
    render(<ClienteForm />)

    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'email-non-valida')

    const saveButton = screen.getByRole('button', { name: /Crea Cliente/ })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Email non valida')).toBeInTheDocument()
    })
  })
})
