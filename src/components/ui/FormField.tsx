import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function FormField({ label, error, id, ...props }: FormFieldProps) {
  const fieldId = id ?? props.name

  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      <input id={fieldId} className={error ? 'input-error' : ''} {...props} />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
