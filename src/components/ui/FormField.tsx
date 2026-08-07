import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function RequiredMark() {
  return (
    <span className="field-required" aria-hidden="true">
      *
    </span>
  )
}

export function FormField({ label, error, id, required, ...props }: FormFieldProps) {
  const fieldId = id ?? props.name

  return (
    <div className="form-field">
      <label htmlFor={fieldId}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      <input
        id={fieldId}
        required={required}
        aria-required={required || undefined}
        className={error ? 'input-error' : ''}
        {...props}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
