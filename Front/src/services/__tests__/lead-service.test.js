import { describe, expect, it, vi, beforeEach } from 'vitest';
import { api } from '../api';
import { createPublicLead } from '../lead-service';

vi.mock('../api', () => ({
  api: { post: vi.fn() },
}));

describe('Lead service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posts the trial lead payload to the public endpoint', async () => {
    const payload = {
      instituteSlug: 'academy',
      contactName: 'Parent',
      phone: '0812345678',
      email: 'parent@example.com',
    };
    api.post.mockResolvedValue({ data: { id: 42, status: 'created' }, status: 201 });

    await expect(createPublicLead(payload)).resolves.toEqual({
      data: { id: 42, status: 'created' },
      status: 201,
    });
    expect(api.post).toHaveBeenCalledWith('/public/leads', payload);
  });

  it('propagates API validation failures', async () => {
    const error = new Error('Contact name is required.');
    api.post.mockRejectedValue(error);

    await expect(createPublicLead({ instituteSlug: 'academy' })).rejects.toBe(error);
  });
});
