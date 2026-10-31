/**
 * Shared form field: label + input/select/textarea + hint + error message.
 * Every form in the app uses this so validation feedback looks the same everywhere.
 *
 * <FormField label="Email" name="email" type="email" value={...} onChange={...} error={errors.email} />
 * <FormField as="select" options={['A', 'B']} ... />
 *
 * NFR-02: the label is always linked to its input, required fields are announced to
 * screen readers, and the hint/error text is connected to the input (aria-describedby)
 * so the error is read out when the field is focused.
 */
export default function FormField({ label, name, as = 'input', options = [], error, hint, required, ...rest }) {
  const id = `field-${name}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  const normalizedOptions = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));

  const a11yProps = {
    id,
    name,
    'aria-invalid': error ? true : undefined,
    'aria-required': required ? true : undefined,
    'aria-describedby': describedBy,
  };

  let control;
  if (as === 'select') {
    control = (
      <select {...a11yProps} {...rest}>
        {normalizedOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (as === 'textarea') {
    control = <textarea {...a11yProps} rows={5} {...rest} />;
  } else {
    control = <input {...a11yProps} {...rest} />;
  }

  return (
    <div className={`form-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && (
          <>
            <span className="required-mark" aria-hidden="true">
              {' '}
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {control}
      {hint && (
        <small id={hintId} className="field-hint">
          {hint}
        </small>
      )}
      {error && (
        <small id={errorId} className="field-error">
          <span aria-hidden="true">⚠ </span>
          {error}
        </small>
      )}
    </div>
  );
}
