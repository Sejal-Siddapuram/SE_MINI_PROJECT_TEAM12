import api from './api';

// FR-05: Student applications

/** Applies to a listing. Resolves with the new application, or rejects with the standard API error. */
export async function applyToListing(listingId) {
  const { data } = await api.post('/applications', { listingId });
  return data.data;
}
