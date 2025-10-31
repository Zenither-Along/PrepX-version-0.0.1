import React from 'react';

export const ResizeGripIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 10 10" fill="currentColor">
        <circle cx="8.5" cy="1.5" r="1.5" />
        <circle cx="5" cy="5" r="1.5" />
        <circle cx="1.5" cy="8.5" r="1.5" />
    </svg>
);
