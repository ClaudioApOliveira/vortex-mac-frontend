import type { TextareaHTMLAttributes } from 'react'
import { RequiredMark } from './FormField'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function TextAreaField({
  label,
  error,
  id,
  required,
  ...props
}: TextAreaFieldProps) {
  const fieldId = id ?? props.name

  return (
    <div className="form-field">
      <label htmlFor={fieldId}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      <textarea
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
