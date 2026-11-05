import { useEffect, useRef, useState } from 'react';
import FormField from '../../components/FormField';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import { getProfile, openResume, updateProfile, uploadResume } from '../../services/profileApi';
import { getErrorMessage, getFieldErrors } from '../../services/api';

const BRANCHES = ['CSE', 'CSE (AI & ML)', 'ECE', 'EEE', 'ME', 'Biotechnology'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const MAX_RESUME_BYTES = 2 * 1024 * 1024;

function toForm(profile) {
  return {
    name: profile.name,
    branch: profile.branch,
    semester: String(profile.semester),
    cgpa: profile.cgpa === null ? '' : String(profile.cgpa),
    skills: profile.skills.join(', '),
  };
}

function parseSkills(text) {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (form.cgpa !== '' && (Number.isNaN(Number(form.cgpa)) || Number(form.cgpa) < 0 || Number(form.cgpa) > 10)) {
    errors.cgpa = 'CGPA must be between 0 and 10.';
  }
  const skills = parseSkills(form.skills);
  if (skills.length > 20) errors.skills = 'Add at most 20 skills.';
  else if (skills.some((s) => s.length > 30)) errors.skills = 'Each skill must be at most 30 characters.';
  return errors;
}

/** FR-03: Student creates and edits their profile (academic details, skills, resume) */
export default function Profile() {
  const fileInput = useRef(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeError, setResumeError] = useState('');

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data);
        setForm(toForm(data));
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    const clientErrors = validate(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSaving(true);
    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        branch: form.branch,
        semester: Number(form.semester),
        cgpa: form.cgpa === '' ? null : Number(form.cgpa),
        skills: parseSkills(form.skills),
      });
      setProfile(updated);
      setForm(toForm(updated));
      setMessage('Profile saved.');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleResume(e) {
    const file = e.target.files[0];
    e.target.value = '';
    setResumeError('');
    setMessage('');
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setResumeError('Only PDF files can be uploaded.');
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setResumeError('The resume must be 2 MB or smaller.');
      return;
    }

    setUploading(true);
    try {
      setProfile(await uploadResume(file));
      setMessage('Resume uploaded.');
    } catch (err) {
      setResumeError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleView() {
    setResumeError('');
    try {
      await openResume();
    } catch (err) {
      setResumeError('Could not open the resume. Please try again.');
    }
  }

  if (error && !profile) return <Alert type="error">{error}</Alert>;
  if (!profile || !form) return <p className="muted">Loading your profile…</p>;

  const missing = [];
  if (profile.skills.length === 0) missing.push('skills');
  if (!profile.hasResume) missing.push('a resume');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My profile</h1>
          <p className="muted">
            {profile.usn} · {profile.email}
          </p>
        </div>
        <StatusBadge status={profile.isComplete ? 'Complete' : 'Incomplete'} />
      </div>

      {!profile.isComplete && (
        <Alert type="info">Add {missing.join(' and ')} to complete your profile. You need a complete profile to apply.</Alert>
      )}
      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      <section className="card">
        <h2>Details</h2>
        <form onSubmit={handleSave} noValidate>
          <FormField label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} required />
          <div className="form-row-3">
            <FormField
              label="Branch"
              name="branch"
              as="select"
              options={BRANCHES.includes(form.branch) ? BRANCHES : [form.branch, ...BRANCHES]}
              value={form.branch}
              onChange={handleChange}
              error={errors.branch}
              required
            />
            <FormField
              label="Semester"
              name="semester"
              as="select"
              options={SEMESTERS}
              value={form.semester}
              onChange={handleChange}
              error={errors.semester}
              required
            />
            <FormField
              label="CGPA"
              name="cgpa"
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={form.cgpa}
              onChange={handleChange}
              error={errors.cgpa}
              hint="Out of 10"
            />
          </div>
          <FormField
            label="Skills"
            name="skills"
            value={form.skills}
            onChange={handleChange}
            error={errors.skills}
            hint="Separate with commas, e.g. Java, React, SQL"
          />
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save details'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Resume</h2>
        <p className="muted">PDF only, up to 2 MB. Recruiters see it when you apply.</p>
        <Alert type="error">{resumeError}</Alert>

        {profile.hasResume ? (
          <p>
            <strong>{profile.resumeOriginalName}</strong>
            <span className="muted"> · uploaded {new Date(profile.resumeUploadedAt).toLocaleDateString('en-IN')}</span>
          </p>
        ) : (
          <p className="muted">No resume uploaded yet.</p>
        )}

        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleResume}
          hidden
          aria-label="Choose resume PDF"
        />
        <div className="btn-group">
          <button type="button" className="btn btn-primary" disabled={uploading} onClick={() => fileInput.current.click()}>
            {uploading ? 'Uploading…' : profile.hasResume ? 'Replace resume' : 'Upload resume'}
          </button>
          {profile.hasResume && (
            <button type="button" className="btn btn-secondary" onClick={handleView}>
              View resume
            </button>
          )}
        </div>
      </section>
    </>
  );
}
