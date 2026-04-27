import React, { HTMLAttributes } from 'react';

export type DataLabelLayout = 'vertical' | 'horizontal';

export interface DataLabelProps extends HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  layout?: DataLabelLayout;
}

export function DataLabel({ 
  label, 
  value, 
  subtext, 
  layout = 'vertical', 
  className = '', 
  ...props 
}: DataLabelProps) {
  
  if (layout === 'horizontal') {
    return (
      <div className={`flex items-baseline justify-between py-1 ${className}`} {...props}>
        <div className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-tertiary)] tracking-[var(--ds-tracking-data)] uppercase min-w-[140px] truncate pr-4">
          {label}
        </div>
        <div className="font-body text-[var(--ds-text-base)] text-[var(--ds-text-primary)] font-medium text-right">
          {value}
        </div>
      </div>
    );
  }

  // Vertical layout (default) - used for KPIs
  return (
    <div className={`flex flex-col ${className}`} {...props}>
      <div className="font-data text-[var(--ds-text-xs)] text-[var(--ds-text-muted)] tracking-[var(--ds-tracking-label)] uppercase mb-[var(--ds-space-1)]">
        {label}
      </div>
      <div className="font-display text-[var(--ds-text-2xl)] md:text-[var(--ds-text-3xl)] text-[var(--ds-text-primary)] leading-none font-bold">
        {value}
      </div>
      {subtext && (
        <div className="mt-[var(--ds-space-1)] font-body text-[var(--ds-text-sm)] text-[var(--ds-text-tertiary)]">
          {subtext}
        </div>
      )}
    </div>
  );
}
