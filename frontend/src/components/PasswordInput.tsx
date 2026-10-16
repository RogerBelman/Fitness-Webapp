import { useState, type InputHTMLAttributes } from 'react'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  toggleLabel: string
}

export function PasswordInput({ toggleLabel, ...inputProps }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="PasswordInput">
      <input {...inputProps} type={isVisible ? 'text' : 'password'} />
      <button
        aria-label={`${isVisible ? 'Hide' : 'Show'} ${toggleLabel}`}
        className="PasswordVisibilityToggle"
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
      >
        {isVisible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
