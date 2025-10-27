import React, { useEffect, useRef } from 'react';

export const AutoSizingTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { onChange: (value: string) => void }> = ({ value, onChange, className, ...props }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full resize-none overflow-hidden ${className}`}
            {...props}
        />
    );
};
