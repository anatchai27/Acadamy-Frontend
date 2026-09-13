import { describe, expect, it, vi, beforeEach } from 'vitest';
import { api } from '../api';
import { makeupService } from '../makeup-service';

vi.mock('../api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

describe('Makeup service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads future slots with filters', async () => {
    await makeupService.getMakeupSlots({ teacherId: 4 });
    expect(api.get).toHaveBeenCalledWith('/makeup/slots', { params: { teacherId: 4 } });
  });

  it('creates a slot with the API payload', async () => {
    const payload = { teacherId: 4, scheduledAt: '2026-10-01T10:00:00.000Z', capacity: 3, roomId: 'A' };
    await makeupService.createMakeupSlot(payload);
    expect(api.post).toHaveBeenCalledWith('/makeup/slots', payload);
  });

  it('cancels a slot through the group-cancel endpoint', async () => {
    await makeupService.cancelMakeupSlot(12);
    expect(api.post).toHaveBeenCalledWith('/makeup/slots/12/cancel', {});
  });
});
