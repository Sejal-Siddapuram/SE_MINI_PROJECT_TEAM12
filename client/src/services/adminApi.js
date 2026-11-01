import api from './api';

// FR-10: Admin / TPO - recruiter onboarding and listing moderation

export async function onboardRecruiter(recruiter) {
  const { data } = await api.post('/admin/recruiters', recruiter);
  return data.data;
}

export async function getRecruiters() {
  const { data } = await api.get('/admin/recruiters');
  return data.data;
}

/** approvalStatus: '' (all) | 'Pending' | 'Approved' | 'Removed' */
export async function getListingsForModeration(approvalStatus) {
  const { data } = await api.get('/admin/listings', { params: approvalStatus ? { approvalStatus } : {} });
  return data.data;
}

/** action: 'approve' | 'remove' | 'edit' */
export async function moderateListing(id, action, extra = {}) {
  const { data } = await api.patch(`/admin/listings/${id}/moderation`, { action, ...extra });
  return data.data;
}

export async function getAuditLogs() {
  const { data } = await api.get('/admin/audit-logs');
  return data.data;
}
