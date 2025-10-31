import React from 'react';

export const DragHandleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="6" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="18" r="1" />
        <circle cx="6" cy="6" r="1" />
        <circle cx="6" cy="12" r="1" />
        <circle cx="6" cy="18" r="1" />
    </svg>
);
