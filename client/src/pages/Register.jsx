import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import Alert from '../components/Alert';
import { registerStudent } from '../services/authApi';
import { getErrorMessage, getFieldErrors } from '../services/api';

const BRANCHES = ['CSE', 'CSE (AI & ML)', 'ECE', 'EEE', 'ME', 'Biotechnology'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const USN_PATTERN = /^PES[0-9]UG[0-9]{2}[A-Z]{2}[0-9]{3}$/i;

const EMPTY_FORM = {
  name: '',
  usn: '',
  email: '',
  password: '',
  confirmPassword: '',
  branch: '',
  semester: '',
};

/** Same rules as the server, checked in the browser first for instant feedback */
function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!USN_PATTERN.test(form.usn.trim())) errors.usn = 'Enter a valid USN, e.g. PES1UG23CS400.';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
    errors.password = 'Use at least 8 characters with a letter and a digit.';
  }
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
  if (!form.branch) errors.branch = 'Select your branch.';
  if (!form.semester) errors.semester = 'Select your semester.';
  return errors;
}

/** FR-01: Student registration with college-issued credentials */
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    const clientErrors = validate(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      await registerStudent({ ...payload, semester: Number(payload.semester) });
      navigate('/login', { state: { registered: true, email: form.email } });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card narrow">
      <h1>Create your student account</h1>
      <p className="muted">Use your college-issued details. Recruiter accounts are created by the TPO.</p>

      <Alert type="error">{serverError}</Alert>

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} required autoComplete="name" />
        <FormField
          label="USN"
          name="usn"
          value={form.usn}
          onChange={handleChange}
          error={errors.usn}
          hint="Your university seat number, e.g. PES1UG23CS400"
          required
        />
        <FormField label="College email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} required autoComplete="email" />

        <div className="form-row">
          <FormField
            label="Branch"
            name="branch"
            as="select"
            options={[{ value: '', label: 'Select branch' }, ...BRANCHES]}
            value={form.branch}
            onChange={handleChange}
            error={errors.branch}
            required
          />
          <FormField
            label="Semester"
            name="semester"
            as="select"
            options={[{ value: '', label: 'Select semester' }, ...SEMESTERS]}
            value={form.semester}
            onChange={handleChange}
            error={errors.semester}
            required
          />
        </div>

        <div className="form-row">
          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            hint="At least 8 characters, with a letter and a digit"
            required
            autoComplete="new-password"
          />
          <FormField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Register'}
        </button>
      </form>

      <p className="form-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
