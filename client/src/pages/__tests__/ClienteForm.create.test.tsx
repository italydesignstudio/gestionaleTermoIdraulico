import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import ClienteForm from '../ClienteForm'
import { setupMockClientiService, mockClientiService } from '../../test/mocks'

vi.mock('../../services/clientiService', () => ({
  default: mockClientiService
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({})
  }
})

describe('ClienteForm - Creazione Nuovo Cliente', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    setupMockClientiService()
  })

  it('dovrebbe inviare i dati del cliente con codice fiscale', async () => {
    render(<ClienteForm />)

    await user.type(screen.getByLabelText('Nome *'), 'Mario')
    await user.type(screen.getByLabelText('Cognome *'), 'Rossi')
    await user.type(screen.getByLabelText('Codice Fiscale *'), 'RSSMRA80A01H501U')
    await user.type(screen.getByLabelText('Telefono'), '1234567890')

    const saveButton = screen.getByRole('button', { name: /Crea Cliente/ })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockClientiService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Mario',
          cognome: 'Rossi',
          codiceFiscale: 'RSSMRA80A01H501U',
          telefono: '1234567890'
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
