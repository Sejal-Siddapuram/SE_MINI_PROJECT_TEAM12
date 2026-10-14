/**
 * Shared form field: label + input/select/textarea + hint + error message.
 * Every form in the app uses this so validation feedback looks the same everywhere.
 *
 * <FormField label="Email" name="email" type="email" value={...} onChange={...} error={errors.email} />
 * <FormField as="select" options={['A', 'B']} ... />
 */
export default function FormField({ label, name, as = 'input', options = [], error, hint, required, ...rest }) {
  const id = `field-${name}`;
  const normalizedOptions = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));

  let control;
  if (as === 'select') {
    control = (
      <select id={id} name={name} {...rest}>
        {normalizedOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (as === 'textarea') {
    control = <textarea id={id} name={name} rows={5} {...rest} />;
  } else {
    control = <input id={id} name={name} {...rest} />;
  }

  return (
    <div className={`form-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && ' *'}
      </label>
      {control}
      {hint && <small className="field-hint">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}
