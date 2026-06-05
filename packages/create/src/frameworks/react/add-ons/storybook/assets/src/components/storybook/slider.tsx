import React from 'react'

export interface SliderProps {
  label: string
  id: string
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  showValue?: boolean
  className?: string
}

export const Slider: React.FC<SliderProps> = ({
  label,
  id,
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex justify-between items-center">
        <label
          htmlFor={id}
          className="text-sm font-medium text-[var(--sea-ink)]"
        >
          {label}
        </label>
        {showValue && (
          <span className="min-w-12 text-right text-sm font-semibold text-[var(--lagoon-deep)]">
            {value}
          </span>
        )}
      </div>
      <input
        type="range"
        id={id}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[var(--chip-bg)] accent-[var(--lagoon-deep)]"
      />
      <div className="demo-muted flex justify-between text-xs">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
