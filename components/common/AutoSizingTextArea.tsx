import React, { useEffect, useRef, forwardRef, useCallback } from 'react';

// FIX: Wrap the component with React.forwardRef to allow it to accept a ref from parent components.
export const AutoSizingTextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { onChange: (value: string) => void }>(({ value, onChange, className, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback((node: HTMLTextAreaElement | null) => {
        // Keep an internal reference for the component's own logic
        internalRef.current = node;
        // Forward the ref to the parent component
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    }, [ref]);

    useEffect(() => {
        if (internalRef.current) {
            internalRef.current.style.height = 'auto';
            internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
        }
    }, [value]);

    return (
        <textarea
            ref={setRefs}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full resize-none overflow-hidden ${className}`}
            {...props}
        />
    );
});
