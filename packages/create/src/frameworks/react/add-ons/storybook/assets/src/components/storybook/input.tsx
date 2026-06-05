import React from 'react'

export interface InputProps {
  label: string
  id: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  id,
  value = '',
  onChange,
  placeholder,
  required = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-[var(--sea-ink)]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="demo-input"
      />
    </div>
  )
}
