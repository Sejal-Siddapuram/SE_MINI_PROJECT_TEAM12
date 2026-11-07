import api from './api';
export async function getMockTests() { return (await api.get('/prep/tests')).data.data; }
export async function getMockTest(id) { return (await api.get('/prep/tests/' + id)).data.data; }
export async function submitMockTest(id, answers) {
  return (await api.post('/prep/tests/' + id + '/submit', { answers })).data.data;
}
export async function getMockAttempts() { return (await api.get('/prep/tests/attempts')).data.data; }
export async function getInterviewContent() { return (await api.get('/prep/interview')).data.data; }
