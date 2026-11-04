import api from './api';

// FR-05: Student applications

/** Applies to a listing. Resolves with the new application, or rejects with the standard API error. */
export async function applyToListing(listingId) {
  const { data } = await api.post('/applications', { listingId });
  return data.data;
}

// FR-06: list my applications, and withdraw one

/** The student's own applications, newest first. Each has { id, status, appliedAt, listing } */
export async function getMyApplications() {
  const { data } = await api.get('/applications/me');
  return data.data;
}

/** Withdraws an application that is still Applied. Resolves with nothing (204). */
export async function withdrawApplication(applicationId) {
  await api.delete(`/applications/${applicationId}`);
}
