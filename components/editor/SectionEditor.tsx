import React, { useState, useCallback, useRef } from 'react';
import { DynamicContentSection, SectionType } from '../../types';
import { XIcon, ResizeGripIcon, ChevronDownIcon } from '../icons';
import { AutoSizingTextArea } from '../common/AutoSizingTextArea';
import { EditableVideoSection } from './EditableVideoSection';

export const SectionEditor: React.FC<{
    section: DynamicContentSection;
    updateSectionContent: (id: string, content: any) => void;
    deleteSection: (id: string) => void;
    isDragging: boolean;
}> = ({ section, updateSectionContent, deleteSection, isDragging }) => {

    const [isResizing, setIsResizing] = useState(false);
    const imageRef = useRef<HTMLDivElement>(null);

    const handleUpdate = (newContent: any) => {
        updateSectionContent(section.id, { ...(section.content || {}), ...newContent });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    handleUpdate({ src: event.target.result as string, width: 100 });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const startImageResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const imageNode = imageRef.current;
        if (!imageNode) return;

        const startWidth = imageNode.offsetWidth;
        const parentWidth = imageNode.parentElement?.offsetWidth || startWidth;

        const doDrag = (moveEvent: MouseEvent | TouchEvent) => {
            const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const newWidth = startWidth + (currentX - startX);
            const newWidthPercent = Math.max(20, Math.min((newWidth / parentWidth) * 100, 100));
            handleUpdate({ width: newWidthPercent });
        };
        const stopDrag = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', doDrag as EventListener);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', doDrag as EventListener);
            document.removeEventListener('touchend', stopDrag);
        };
        
        document.addEventListener('mousemove', doDrag as EventListener);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', doDrag as EventListener);
        document.addEventListener('touchend', stopDrag);
    }, [section.content]);


    const renderContentEditor = () => {
        switch (section.type) {
            case SectionType.HEADING:
                return <AutoSizingTextArea value={section.content?.text || ''} onChange={text => handleUpdate({ text })} placeholder="Heading" className="text-2xl font-bold border-none p-0 focus:ring-0 bg-transparent w-full" rows={1} />;
            case SectionType.SUB_HEADING:
                return <AutoSizingTextArea value={section.content?.text || ''} onChange={text => handleUpdate({ text })} placeholder="Sub-heading" className="text-xl font-semibold text-gray-700 border-none p-0 focus:ring-0 bg-transparent w-full" rows={1} />;
            case SectionType.PARAGRAPH:
                return <AutoSizingTextArea value={section.content?.text || ''} onChange={text => handleUpdate({ text })} placeholder="Paragraph" className="border-none focus:ring-0 p-0 bg-brand-primary" />;
            case SectionType.IMAGE:
                 return (
                    <div className="relative group/image">
                        {section.content?.src ? (
                            <div ref={imageRef} className="relative inline-block" style={{ width: `${section.content.width || 100}%` }}>
                                <img src={section.content.src} alt="content" className={`w-full h-auto transition-shadow ${isResizing ? 'shadow-2xl ring-2 ring-blue-500' : ''}`}/>
                                <div
                                  onMouseDown={startImageResize}
                                  onTouchStart={startImageResize}
                                  className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-full border-2 border-blue-500 cursor-nwse-resize flex items-center justify-center touch-none"
                                >
                                    <ResizeGripIcon className="w-4 h-4 text-blue-600" />
                                </div>
                            </div>
                        ) : (
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
                        )}
                    </div>
                );
            case SectionType.VIDEO:
                return (
                    <EditableVideoSection 
                        url={section.content?.url}
                        onUrlChange={url => handleUpdate({ url })}
                        width={section.content?.width}
                        onWidthChange={width => handleUpdate({ width })}
                    />
                );
            case SectionType.BULLETS:
                 return (
                    <div className="space-y-1">
                        <div className="flex items-center gap-4 mb-2">
                             <label className="flex items-center text-sm">
                                <input type="checkbox" checked={section.content?.ordered || false} onChange={e => handleUpdate({ ordered: e.target.checked })} className="mr-2"/>
                                Numbered List
                            </label>
                        </div>
                        {section.content?.items?.map((item: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="text-gray-500 pt-1">{section.content.ordered ? `${index + 1}.` : '•'}</span>
                                <AutoSizingTextArea value={item} onChange={val => {
                                    const newItems = [...section.content.items];
                                    newItems[index] = val;
                                    handleUpdate({ items: newItems });
                                }} className="w-full p-1 bg-transparent border-none focus:ring-0" rows={1} />
                                <button onClick={() => handleUpdate({ items: section.content.items.filter((_: any, i: number) => i !== index) })} className="p-1 text-gray-400 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
                            </div>
                        ))}
                        <button onClick={() => handleUpdate({ items: [...(section.content?.items || []), ''] })} className="text-sm text-gray-600 hover:text-gray-900 mt-2 ml-4">+ Add item</button>
                    </div>
                );
            case SectionType.QANDA:
                const isCollapsed = section.content?.isCollapsed || false;
                return (
                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                            <span className="font-bold text-gray-500 pt-1">Q:</span>
                            <AutoSizingTextArea value={section.content?.question || ''} onChange={question => handleUpdate({ question })} placeholder="Question" className="font-bold bg-transparent border-none focus:ring-0 p-1 w-full flex-1" rows={1} />
                        </div>
                         <div 
                            className="flex items-start gap-2 cursor-pointer" 
                            onClick={() => handleUpdate({ isCollapsed: !isCollapsed })}
                        >
                            <ChevronDownIcon className={`w-5 h-5 mt-2 transition-transform flex-shrink-0 ${!isCollapsed ? 'rotate-180' : ''}`} />
                            {!isCollapsed && (
                                <div className="flex-1" onClick={e => e.stopPropagation()}>
                                    <AutoSizingTextArea 
                                        value={section.content?.answer || ''} 
                                        onChange={answer => handleUpdate({ answer })} 
                                        placeholder="Answer" 
                                        className="bg-transparent border-none focus:ring-0 p-1" 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );
            case SectionType.LINK:
                 return (
                    <div className="space-y-2 border p-3 rounded-lg">
                        <AutoSizingTextArea value={section.content?.text || ''} onChange={text => handleUpdate({ text })} placeholder="Link Text" className="font-medium bg-transparent border-none focus:ring-0 p-1 w-full" rows={1} />
                        <input value={section.content?.url || ''} onChange={e => handleUpdate({ url: e.target.value })} placeholder="URL (e.g., https://example.com)" className="text-sm text-blue-600 bg-transparent border-none focus:ring-0 p-1 w-full" />
                    </div>
                );
            default: return null;
        }
    };
    
    return (
        <div className={`border border-transparent hover:border-gray-200 rounded-md relative group/section transition-all duration-200 ${isDragging ? 'opacity-50 shadow-lg scale-105' : ''}`}>
             <div className="p-2">
                {renderContentEditor()}
            </div>
            <button onClick={() => deleteSection(section.id)} className="absolute -top-2 -right-2 p-1 bg-white rounded-full text-gray-400 hover:text-red-600 opacity-0 group-hover/section:opacity-100 transition-opacity border border-gray-300">
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
};
