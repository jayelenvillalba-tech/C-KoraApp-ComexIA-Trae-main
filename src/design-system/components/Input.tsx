import React, { InputHTMLAttributes, useState } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = '', id, value, defaultValue, onChange, onFocus, onBlur, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  
  // Checking if input has content to keep the label floating
  const hasValue = value !== undefined ? String(value).length > 0 : defaultValue !== undefined ? String(defaultValue).length > 0 : false;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`relative flex flex-col ${className}`}>
      <label 
        htmlFor={inputId}
        className={`absolute left-3 transition-all duration-[var(--ds-ease-base)] pointer-events-none font-data
          ${isFloating 
            ? 'top-1.5 text-[var(--ds-text-xs)] text-[var(--ds-cyan)] tracking-[var(--ds-tracking-data)] uppercase font-semibold' 
            : 'top-1/2 -translate-y-1/2 text-[var(--ds-text-sm)] text-[var(--ds-text-muted)] tracking-normal normal-case font-normal'
          }
        `}
      >
        {label}
      </label>
      
      <input
        id={inputId}
        value={value}
        defaultValue={defaultValue}
        className={`
          w-full bg-[var(--ds-bg-input)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-sm)] 
          font-body text-[var(--ds-text-primary)] text-[var(--ds-text-base)]
          px-3 pt-5 pb-1 h-12 outline-none transition-all duration-[var(--ds-ease-fast)]
          focus:border-[var(--ds-cyan)] focus:shadow-[0_0_0_3px_var(--ds-cyan-dim)]
          placeholder-transparent
        `}
        placeholder={label} // Required for some screen readers, but text is transparent via class
        onFocus={(e) => {
          setIsFocused(true);
          if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          // If the component is uncontrolled, we need to read the target value to keep the label floated
          if (value === undefined && e.target.value.length > 0) {
            // It has a value, label CSS will be derived from DOM state in a real uncontrolled setup or we just rely on parent
          }
          if (onBlur) onBlur(e);
        }}
        onChange={onChange}
        {...props}
      />
      {/* Small hack for uncontrolled inputs to keep label floating when they have value but blur */}
      <style>{`
        input:not(:placeholder-shown) + label {
          top: 0.375rem !important;
          font-size: var(--ds-text-xs) !important;
          color: var(--ds-cyan) !important;
          letter-spacing: var(--ds-tracking-data) !important;
          text-transform: uppercase !important;
          transform: none !important;
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
}
