import api from './api';

// FR-07: Recruiter listing management

export async function getMyListings() {
  const { data } = await api.get('/recruiter/listings');
  return data.data;
}

export async function getMyListing(id) {
  const { data } = await api.get(`/recruiter/listings/${id}`);
  return data.data;
}

export async function createListing(listing) {
  const { data } = await api.post('/listings', listing);
  return data.data;
}

export async function updateListing(id, listing) {
  const { data } = await api.put(`/listings/${id}`, listing);
  return data.data;
}

/** action: 'publish' | 'close' */
export async function setPublishState(id, action) {
  const { data } = await api.patch(`/listings/${id}/publish`, { action });
  return data.data;
}
