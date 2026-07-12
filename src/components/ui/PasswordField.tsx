import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export function PasswordField({ label, error, id, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const fieldId = id ?? props.name

  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      <div className="password-field">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          className={error ? 'input-error' : ''}
          {...props}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
