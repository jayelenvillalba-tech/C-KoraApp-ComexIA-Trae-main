import React, { HTMLAttributes } from 'react';

export type BadgeVariant = 'verified' | 'pending' | 'blocked' | 'sell' | 'buy' | 'premium' | 'institutional' | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  text?: string;
}

export function Badge({ variant = 'neutral', text, children, className = '', ...props }: BadgeProps) {
  
  const baseStyles = 'inline-flex items-center font-data text-[var(--ds-text-xs)] font-medium tracking-[var(--ds-tracking-data)] uppercase rounded-[var(--ds-radius-sm)] px-2 py-0.5 border';
  
  let variantStyles = '';

  switch (variant) {
    case 'verified':
      variantStyles = 'bg-[var(--ds-green-dim)] border-[var(--ds-green)] text-[var(--ds-green-text)]';
      break;
    case 'pending':
      variantStyles = 'bg-[var(--ds-amber-dim)] border-[var(--ds-amber)] text-[var(--ds-amber-text)]';
      break;
    case 'blocked':
      variantStyles = 'bg-[var(--ds-red-dim)] border-[var(--ds-red)] text-[var(--ds-red-text)]';
      break;
    case 'sell':
      variantStyles = 'bg-[var(--ds-cyan-dim)] border-[var(--ds-cyan)] text-[var(--ds-cyan-text)]';
      break;
    case 'buy':
      variantStyles = 'bg-[var(--ds-blue-dim)] border-[var(--ds-blue)] text-[var(--ds-blue)]';
      break;
    case 'premium':
    case 'institutional':
      variantStyles = 'bg-[var(--ds-gold-dim)] border-[var(--ds-gold)] text-[var(--ds-gold-text)]';
      break;
    case 'neutral':
    default:
      variantStyles = 'bg-[var(--ds-bg-overlay)] border-[var(--ds-border-default)] text-[var(--ds-text-secondary)]';
      break;
  }

  // Auto icon logic based on variant if no children but text is provided
  let content = children || text;
  if (!children && text) {
    if (variant === 'verified') content = <>&#10003; {text}</>; // ✓
    if (variant === 'pending') content = <>&#8987; {text}</>; // ⏳
    if (variant === 'blocked') content = <>&#10007; {text}</>; // ✗
  }

  return (
    <span className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {content}
    </span>
  );
}
