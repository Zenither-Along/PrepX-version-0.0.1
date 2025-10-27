import React, { useState, useCallback, useRef } from 'react';
import { DynamicContentSection } from '../../types';
import { XIcon, ResizeGripIcon } from '../icons';
import { AutoSizingTextArea } from '../common/AutoSizingTextArea';

export const FloatingSectionEditor: React.FC<{
    section: DynamicContentSection;
    updateSectionContent: (id: string, content: any) => void;
    deleteSection: (id: string) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}> = ({ section, updateSectionContent, deleteSection, containerRef }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const onDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        const startX = e.clientX - section.content.x;
        const startY = e.clientY - section.content.y;
        const containerRect = containerRef.current?.getBoundingClientRect();

        const doDrag = (moveEvent: MouseEvent) => {
            if (!containerRect) return;
            let newX = moveEvent.clientX - startX;
            let newY = moveEvent.clientY - startY;
            
            updateSectionContent(section.id, { ...section.content, x: newX, y: newY });
        };
        const stopDrag = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        };
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }, [section.content, updateSectionContent, containerRef]);

    const onResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = section.content.width;
        const startHeight = section.content.height;

        const doResize = (moveEvent: MouseEvent) => {
             updateSectionContent(section.id, { 
                ...section.content, 
                width: Math.max(100, startWidth + moveEvent.clientX - startX),
                height: Math.max(50, startHeight + moveEvent.clientY - startY)
            });
        };
        const stopResize = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
        };
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    }, [section.content, updateSectionContent]);

    return (
        <div 
            ref={ref}
            style={{ 
                position: 'absolute', 
                transform: `translate(${section.content.x}px, ${section.content.y}px)`,
                width: section.content.width,
                height: section.content.height
            }}
            className={`bg-gray-100/80 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg p-2 flex flex-col group/floating ${isDragging || isResizing ? 'shadow-2xl z-20' : 'z-10'}`}
        >
             <div className="flex justify-between items-center mb-1 flex-shrink-0" onMouseDown={onDragStart}>
                <div className="text-xs text-gray-500 cursor-move">Floating Note</div>
                <button onClick={() => deleteSection(section.id)} className="p-0.5 text-gray-400 hover:text-red-500">
                    <XIcon className="w-3 h-3" />
                </button>
            </div>
            <AutoSizingTextArea 
                value={section.content.text}
                onChange={text => updateSectionContent(section.id, { ...section.content, text })}
                className="flex-grow bg-transparent border-none focus:ring-0 p-0 text-sm"
                placeholder="Type here..."
            />
            <div onMouseDown={onResizeStart} className="absolute -bottom-1 -right-1 w-3 h-3 cursor-nwse-resize opacity-0 group-hover/floating:opacity-100 transition-opacity">
                <ResizeGripIcon className="w-full h-full text-gray-500" />
            </div>
        </div>
    );
};
