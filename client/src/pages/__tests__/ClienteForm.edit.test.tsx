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
    useParams: () => ({ id: '1' })
  }
})

describe('ClienteForm - Modifica Cliente', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    setupMockClientiService()
  })

  it('dovrebbe caricare i dati esistenti', async () => {
    render(<ClienteForm />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Mario')).toBeInTheDocument()
      expect(screen.getByDisplayValue('RSSMRA80A01H501U')).toBeInTheDocument()
    })
  })

  it('dovrebbe salvare le modifiche', async () => {
    render(<ClienteForm />)
    await waitFor(() => expect(screen.getByDisplayValue('Mario')).toBeInTheDocument())

    const nomeInput = screen.getByDisplayValue('Mario')
    await user.clear(nomeInput)
    await user.type(nomeInput, 'Marco')

    const saveButton = screen.getByRole('button', { name: /Aggiorna Cliente/ })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockClientiService.update).toHaveBeenCalledWith(1, expect.objectContaining({ nome: 'Marco' }))
    })
  })
})
