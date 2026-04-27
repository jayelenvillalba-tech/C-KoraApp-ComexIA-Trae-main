import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  
  const baseStyles = 'inline-flex items-center justify-center font-body font-bold rounded-[var(--ds-radius-md)] transition-all ease-[var(--ds-ease-fast)] duration-150 border box-border';
  
  const sizeStyles = {
    sm: 'h-8 px-3 text-[var(--ds-text-sm)]',
    md: 'h-10 px-4 text-[var(--ds-text-base)]',
    lg: 'h-12 px-6 text-[var(--ds-text-md)]'
  };

  const variantStyles = {
    primary: 'bg-gradient-to-br from-[var(--ds-cyan)] to-[var(--ds-blue)] text-[var(--ds-bg-void)] border-transparent tracking-[0.3px] hover:opacity-90 hover:-translate-y-[1px] hover:scale-[1.01] hover:shadow-[var(--ds-glow-cyan)] active:translate-y-0 active:scale-100',
    secondary: 'bg-transparent text-[var(--ds-cyan-text)] border-[var(--ds-cyan)] hover:bg-[var(--ds-cyan-dim)] active:bg-transparent',
    ghost: 'bg-transparent text-[var(--ds-text-secondary)] border-transparent hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-overlay)]',
    danger: 'bg-transparent text-[var(--ds-red-text)] border-[var(--ds-red)] hover:bg-[var(--ds-red-dim)] hover:shadow-[var(--ds-glow-red)]',
    gold: 'bg-gradient-to-br from-[var(--ds-gold)] to-[#a88220] text-[var(--ds-bg-void)] border-transparent hover:opacity-90 hover:-translate-y-[1px] hover:shadow-[var(--ds-glow-gold)] active:translate-y-0'
  };

  const disabledStyles = disabled ? 'opacity-35 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

  return (
    <button 
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
