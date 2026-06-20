import axiosClient from './axiosClient';

export const saveAdminEvent = ({ eventId, payload }) => {
  if (eventId) {
    return axiosClient.put(`/admin/events/${eventId}`, payload);
  }

  return axiosClient.post('/admin/events', {
    ...payload,
    status: 'APPROVED',
  });
};
