import api from './api';

// UC-11 / FR-06: the logged-in user's own notifications, newest first
export async function getNotifications() {
  const { data } = await api.get('/notifications');
  return data.data;
}
