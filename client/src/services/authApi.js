import api from './api';

// FR-01
export async function registerStudent(form) {
  const { data } = await api.post('/auth/register', form);
  return data.data;
}

// FR-02
export async function loginUser(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data;
}

// SR-04: tell the server to revoke this login token
export async function logoutUser() {
  await api.post('/auth/logout');
}
