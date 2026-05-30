import React, { HTMLAttributes } from 'react';

export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  action?: React.ReactNode;
  onActionClick?: () => void;
}

export function SectionHeader({ 
  title, 
  action, 
  onActionClick, 
  className = '', 
  ...props 
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-[var(--ds-space-4)] ${className}`} {...props}>
      <h3 className="font-data text-[var(--ds-text-xs)] font-medium text-[var(--ds-text-tertiary)] tracking-[var(--ds-tracking-label)] uppercase m-0">
        {title}
      </h3>
      
      {action && (
        <button 
          onClick={onActionClick}
          className="bg-transparent border-none p-0 font-data text-[var(--ds-text-xs)] text-[var(--ds-cyan)] tracking-[var(--ds-tracking-data)] cursor-pointer hover:underline focus:outline-none"
        >
          {action}
        </button>
      )}
    </div>
  );
}
