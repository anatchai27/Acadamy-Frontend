import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TrialClassPage } from '../trial-class-page';
import { createPublicLead } from '../../services/lead-service';

vi.mock('../../services/lead-service', () => ({
  createPublicLead: vi.fn(),
}));

describe('Trial class page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows client validation and does not submit missing required fields', async () => {
    render(<TrialClassPage />);

    fireEvent.submit(screen.getByRole('button', { name: 'Request trial class' }).closest('form'));

    expect(await screen.findByRole('status')).toHaveTextContent('Institute slug is required.');
    expect(createPublicLead).not.toHaveBeenCalled();
  });

  it('submits the contract payload and shows success', async () => {
    createPublicLead.mockResolvedValue({ data: { id: 42, status: 'created' }, status: 201 });
    render(<TrialClassPage />);

    fireEvent.input(screen.getByLabelText('Institute slug'), { target: { value: 'academy' } });
    fireEvent.input(screen.getByLabelText('Contact name'), { target: { value: ' Parent ' } });
    fireEvent.input(screen.getByLabelText('Phone'), { target: { value: '0812345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Request trial class' }).closest('form'));

    expect(await screen.findByRole('status')).toHaveTextContent('Your request has been received.');
    expect(createPublicLead).toHaveBeenCalledWith(expect.objectContaining({
      instituteSlug: 'academy',
      contactName: 'Parent',
      phone: '0812345678',
    }));
  });
});
