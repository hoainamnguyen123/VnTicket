import axiosClient from './axiosClient';

const SUPPORTED_FORMATS = new Set(['pdf', 'excel']);

export const exportEventBookings = async ({ eventId, format, isAdmin }) => {
  if (!SUPPORTED_FORMATS.has(format)) {
    throw new Error('Unsupported export format');
  }
  if (!eventId) {
    throw new Error('Event ID is required');
  }

  const eventScope = isAdmin ? 'event' : 'my-event';
  return axiosClient.get(
    `/bookings/${eventScope}/${eventId}/export/${format}`,
    { responseType: 'blob' },
  );
};
