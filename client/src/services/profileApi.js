import api from './api';

// FR-03: Student profile and resume

export async function getProfile() {
  const { data } = await api.get('/profile');
  return data.data;
}

export async function updateProfile(profile) {
  const { data } = await api.put('/profile', profile);
  return data.data;
}

export async function uploadResume(file) {
  const form = new FormData();
  form.append('resume', file);
  const { data } = await api.post('/profile/resume', form);
  return data.data;
}

/** Opens the student's own resume in a new tab (the file is only served with a valid login) */
export async function openResume() {
  const { data } = await api.get('/profile/resume', { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
