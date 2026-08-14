import type { SelectHTMLAttributes, ReactNode } from 'react'
import { RequiredMark } from './FormField'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

export function SelectField({
  label,
  error,
  hint,
  id,
  required,
  children,
  className,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? props.name
  const classes = [error ? 'input-error' : '', className].filter(Boolean).join(' ')

  return (
    <div className="form-field">
      <label htmlFor={fieldId}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      <select
        id={fieldId}
        required={required}
        aria-required={required || undefined}
        className={classes || undefined}
        {...props}
      >
        {children}
      </select>
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
