
/**
 * Navigation links shown in the navbar and as cards on the dashboard.
 * Each module owner adds the links for their own pages to this list.
 *   roles       -> which user roles can see the link
 *   description -> short text shown on the dashboard card
 */
export const navLinks = [
  { to: '/admin/analytics', label: 'Placement Analytics', roles: ['Admin'], description: 'View student, listing, application and selection totals.' },
  { to: '/mock-tests', label: 'Mock Tests', roles: ['Student'], description: 'Practise aptitude questions and view your scores.' },
  {
    to: '/listings',
    label: 'Find Listings',
    roles: ['Student'],
    description: 'Search and filter published internship and job listings.',
  },
  {
    to: '/applications',
    label: 'My Applications',
    roles: ['Student'],
    description: 'Track your applications, withdraw one, and see status notifications.',
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    roles: ['Student', 'Recruiter', 'Admin'],
    description: 'Your home page.',
  },
  {
    to: '/profile',
    label: 'My Profile',
    roles: ['Student'],
    description: 'Add your academic details and skills, and upload your resume.',
  },
  {
    to: '/recruiter/listings',
    label: 'My Listings',
    roles: ['Recruiter'],
    description: 'Create, edit and publish internship and job listings.',
  },
  {
    to: '/admin/recruiters',
    label: 'Recruiters',
    roles: ['Admin'],
    description: 'Onboard new companies and recruiter accounts.',
  },
  {
    to: '/admin/listings',
    label: 'Moderation',
    roles: ['Admin'],
    description: 'Approve, edit or remove listings before students see them.',
  },
];


