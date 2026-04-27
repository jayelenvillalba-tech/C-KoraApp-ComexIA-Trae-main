import React, { HTMLAttributes } from 'react';

export type CardVariant = 'flat' | 'default' | 'raised';
export type CardSemantic = 'neutral' | 'red' | 'amber' | 'green' | 'cyan';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  semantic?: CardSemantic;
  noPadding?: boolean;
}

export function Card({ 
  variant = 'default', 
  semantic = 'neutral', 
  noPadding = false,
  className = '', 
  children, 
  ...props 
}: CardProps) {
  
  let baseStyles = 'overflow-hidden transition-all duration-[var(--ds-ease-base)]';
  
  if (variant === 'flat') {
    baseStyles += ' bg-transparent border-b border-[var(--ds-border-subtle)] rounded-none';
    if (!noPadding) baseStyles += ' py-[var(--ds-space-3)]';
  } else if (variant === 'default') {
    baseStyles += ' bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] shadow-[var(--ds-shadow-card)]';
    if (!noPadding) baseStyles += ' p-[var(--ds-space-5)]';
  } else if (variant === 'raised') {
    baseStyles += ' bg-[var(--ds-bg-raised)] border border-[var(--ds-border-strong)] rounded-[var(--ds-radius-lg)] shadow-[var(--ds-shadow-raised)]';
    if (!noPadding) baseStyles += ' p-[var(--ds-space-6)]';
  }

  // Semantic side borders
  if (semantic !== 'neutral') {
    if (variant !== 'flat') {
      baseStyles += ` border-l-[3px]`;
      if (semantic === 'red') baseStyles += ' border-l-[var(--ds-red)] bg-[var(--ds-red-dim)] border-t-[var(--ds-red-dim)] border-r-[var(--ds-red-dim)] border-b-[var(--ds-red-dim)]';
      if (semantic === 'amber') baseStyles += ' border-l-[var(--ds-amber)] bg-[var(--ds-amber-dim)] border-t-[var(--ds-amber-dim)] border-r-[var(--ds-amber-dim)] border-b-[var(--ds-amber-dim)]';
      if (semantic === 'green') baseStyles += ' border-l-[var(--ds-green)] bg-[var(--ds-green-dim)] border-t-[var(--ds-green-dim)] border-r-[var(--ds-green-dim)] border-b-[var(--ds-green-dim)]';
      if (semantic === 'cyan') baseStyles += ' border-l-[var(--ds-cyan)] bg-[var(--ds-cyan-dim)] border-t-[var(--ds-cyan-dim)] border-r-[var(--ds-cyan-dim)] border-b-[var(--ds-cyan-dim)]';
    }
  }

  return (
    <div className={`${baseStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}
