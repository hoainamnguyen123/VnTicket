import { beforeEach, describe, expect, it, vi } from 'vitest';
import axiosClient from './axiosClient';
import { exportEventBookings } from './bookingExportApi';

vi.mock('./axiosClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('exportEventBookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads the organizer PDF endpoint as a blob', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    axiosClient.get.mockResolvedValue(blob);

    const result = await exportEventBookings({
      eventId: 12,
      format: 'pdf',
      isAdmin: false,
    });

    expect(axiosClient.get).toHaveBeenCalledWith(
      '/bookings/my-event/12/export/pdf',
      { responseType: 'blob' },
    );
    expect(result).toBe(blob);
  });

  it('downloads the admin Excel endpoint as a blob', async () => {
    const blob = new Blob(['xlsx']);
    axiosClient.get.mockResolvedValue(blob);

    await exportEventBookings({
      eventId: 99,
      format: 'excel',
      isAdmin: true,
    });

    expect(axiosClient.get).toHaveBeenCalledWith(
      '/bookings/event/99/export/excel',
      { responseType: 'blob' },
    );
  });

  it('rejects unsupported formats without calling the API', async () => {
    await expect(exportEventBookings({
      eventId: 1,
      format: 'csv',
      isAdmin: false,
    })).rejects.toThrow('Unsupported export format');

    expect(axiosClient.get).not.toHaveBeenCalled();
  });

  it('rejects a missing event ID without calling the API', async () => {
    await expect(exportEventBookings({
      eventId: null,
      format: 'pdf',
      isAdmin: false,
    })).rejects.toThrow('Event ID is required');

    expect(axiosClient.get).not.toHaveBeenCalled();
  });
});
