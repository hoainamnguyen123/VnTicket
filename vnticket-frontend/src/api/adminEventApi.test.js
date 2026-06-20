import { beforeEach, describe, expect, it, vi } from 'vitest';
import axiosClient from './axiosClient';
import { saveAdminEvent } from './adminEventApi';

vi.mock('./axiosClient', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('saveAdminEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an auto-approved event through the admin endpoint', async () => {
    axiosClient.post.mockResolvedValue({ data: { id: 25 } });

    await saveAdminEvent({
      payload: { name: 'Admin Event' },
    });

    expect(axiosClient.post).toHaveBeenCalledWith('/admin/events', {
      name: 'Admin Event',
      status: 'APPROVED',
    });
    expect(axiosClient.put).not.toHaveBeenCalled();
  });

  it('updates an existing event through the admin endpoint', async () => {
    axiosClient.put.mockResolvedValue({ data: { id: 25 } });

    await saveAdminEvent({
      eventId: 25,
      payload: { name: 'Updated Event' },
    });

    expect(axiosClient.put).toHaveBeenCalledWith('/admin/events/25', {
      name: 'Updated Event',
    });
    expect(axiosClient.post).not.toHaveBeenCalled();
  });
});
