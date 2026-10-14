import api from './api';

// FR-04: Student listing search

/** filters: { keyword, role, company, location, type, deadlineBefore, page, limit } */
export async function searchListings(filters) {
  // Only send filters that have a value
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null));
  const { data } = await api.get('/listings', { params });
  return data.data;
}

export async function getListing(id) {
  const { data } = await api.get(`/listings/${id}`);
  return data.data;
}
