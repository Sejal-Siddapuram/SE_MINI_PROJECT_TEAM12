import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FormField from '../../components/FormField';
import Alert from '../../components/Alert';
import { createListing, getMyListing, updateListing } from '../../services/recruiterApi';
import { getErrorMessage, getFieldErrors } from '../../services/api';

const EMPTY_FORM = {
  title: '',
  role: '',
  type: 'Internship',
  location: '',
  deadline: '',
  eligibility: '',
  description: '',
};

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Title is required.';
  if (!form.role.trim()) errors.role = 'Role is required.';
  if (!form.location.trim()) errors.location = 'Location is required.';
  if (!form.description.trim()) errors.description = 'Description is required.';
  if (!form.deadline) errors.deadline = 'Deadline is required.';
  else if (form.deadline < todayISO()) errors.deadline = 'Choose today or a future date.';
  return errors;
}

/** FR-07: Create a new listing, or edit an existing one (same form) */
export default function ListingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // When editing, load the existing listing into the form
  useEffect(() => {
    if (!isEdit) return;
    getMyListing(id)
      .then((listing) =>
        setForm({
          title: listing.title,
          role: listing.role,
          type: listing.type,
          location: listing.location,
          deadline: listing.deadline.slice(0, 10),
          eligibility: listing.eligibility || '',
          description: listing.description,
        })
      )
      .catch((err) => setServerError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

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

    setSaving(true);
    try {
      if (isEdit) {
        await updateListing(id, form);
        navigate('/recruiter/listings', { state: { message: `"${form.title}" was updated.` } });
      } else {
        await createListing(form);
        navigate('/recruiter/listings', {
          state: { message: `"${form.title}" was saved as a draft. Publish it when you are ready.` },
        });
      }
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">Loading listing…</p>;

  return (
    <section className="card">
      <h1>{isEdit ? 'Edit listing' : 'New listing'}</h1>
      <p className="muted">
        {isEdit
          ? 'If this listing was already approved, saving changes sends it back to the TPO for approval.'
          : 'New listings are saved as drafts and need TPO approval before students can see them.'}
      </p>

      <Alert type="error">{serverError}</Alert>

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          hint="e.g. Summer Software Engineering Intern"
          required
        />
        <div className="form-row-3">
          <FormField
            label="Role"
            name="role"
            value={form.role}
            onChange={handleChange}
            error={errors.role}
            hint="e.g. Software Engineer"
            required
          />
          <FormField
            label="Type"
            name="type"
            as="select"
            options={['Internship', 'Full-time']}
            value={form.type}
            onChange={handleChange}
            error={errors.type}
          />
          <FormField
            label="Location"
            name="location"
            value={form.location}
            onChange={handleChange}
            error={errors.location}
            hint="e.g. Bengaluru or Remote"
            required
          />
        </div>
        <div className="form-row">
          <FormField
            label="Application deadline"
            name="deadline"
            type="date"
            min={todayISO()}
            value={form.deadline}
            onChange={handleChange}
            error={errors.deadline}
            required
          />
          <FormField
            label="Eligibility"
            name="eligibility"
            value={form.eligibility}
            onChange={handleChange}
            error={errors.eligibility}
            hint="e.g. CSE/ECE, CGPA 7.5+, 2027 batch"
          />
        </div>
        <FormField
          label="Description"
          name="description"
          as="textarea"
          value={form.description}
          onChange={handleChange}
          error={errors.description}
          hint="Responsibilities, skills required, stipend/CTC, selection process"
          required
        />

        <div className="btn-group">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save as draft'}
          </button>
          <Link to="/recruiter/listings" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
