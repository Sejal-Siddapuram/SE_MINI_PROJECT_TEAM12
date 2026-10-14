import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import FormField from '../components/FormField';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../services/api';

/** FR-02: Login for every role (Student, Recruiter, Admin) */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  let notice = '';
  if (location.state?.registered) notice = 'Registration successful. Please log in.';
  else if (searchParams.get('expired')) notice = 'Your session expired. Please log in again.';

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    const clientErrors = {};
    if (!form.email.trim()) clientErrors.email = 'Email is required.';
    if (!form.password) clientErrors.password = 'Password is required.';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card narrow">
      <h1>Log in</h1>
      <p className="muted">Students, recruiters and TPO staff all log in here.</p>

      <Alert type="success">{notice}</Alert>
      <Alert type="error">{serverError}</Alert>

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} required autoComplete="email" />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          required
          autoComplete="current-password"
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="form-footer">
        New student? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}
