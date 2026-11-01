import { useEffect, useState } from 'react';
import FormField from '../../components/FormField';
import Alert from '../../components/Alert';
import { getRecruiters, onboardRecruiter } from '../../services/adminApi';
import { getErrorMessage, getFieldErrors } from '../../services/api';

const EMPTY_FORM = { name: '', email: '', company: '', password: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (!form.company.trim()) errors.company = 'Company is required.';
  if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
    errors.password = 'Use at least 8 characters with a letter and a digit.';
  }
  return errors;
}

/** FR-10 / BR-05: TPO onboards recruiter accounts (recruiters cannot self-register) */
export default function OnboardRecruiters() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [recruiters, setRecruiters] = useState([]);

  async function loadRecruiters() {
    try {
      setRecruiters(await getRecruiters());
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    loadRecruiters();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    setMessage('');

    const clientErrors = validate(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSaving(true);
    try {
      const recruiter = await onboardRecruiter(form);
      setMessage(
        `Recruiter account created for ${recruiter.name} (${recruiter.company}). ` +
          `Share the email ${recruiter.email} and the temporary password with them.`
      );
      setForm(EMPTY_FORM);
      await loadRecruiters();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Onboard recruiters</h1>
          <p className="muted">Only the TPO can create recruiter accounts for approved companies.</p>
        </div>
      </div>

      <section className="card">
        <h2>Add a recruiter</h2>
        <Alert type="success">{message}</Alert>
        <Alert type="error">{serverError}</Alert>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <FormField label="Recruiter name" name="name" value={form.name} onChange={handleChange} error={errors.name} required />
            <FormField label="Company" name="company" value={form.company} onChange={handleChange} error={errors.company} required />
          </div>
          <div className="form-row">
            <FormField
              label="Work email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              required
              autoComplete="off"
            />
            <FormField
              label="Temporary password"
              name="password"
              type="text"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              hint="At least 8 characters, with a letter and a digit"
              required
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create recruiter account'}
          </button>
        </form>
      </section>

      <section className="card table-wrap">
        <h2>Onboarded recruiters ({recruiters.length})</h2>
        {recruiters.length === 0 ? (
          <p className="muted">No recruiters onboarded yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Added on</th>
              </tr>
            </thead>
            <tbody>
              {recruiters.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.company}</td>
                  <td>{r.email}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
