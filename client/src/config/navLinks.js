/**
 * Navigation links shown in the navbar and as cards on the dashboard.
 * Each module owner adds the links for their own pages to this list.
 *   roles       -> which user roles can see the link
 *   description -> short text shown on the dashboard card
 */
export const navLinks = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    roles: ['Student', 'Recruiter', 'Admin'],
    description: 'Your home page.',
  },
  {
    to: '/recruiter/listings',
    label: 'My Listings',
    roles: ['Recruiter'],
    description: 'Create, edit and publish internship and job listings.',
  },
];
