import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePaths } from '../hooks/usePaths';
import { LearningPath, PathColumn, PathItem, DynamicContentSection, ColumnType, SectionType } from '../types';
import { ArrowLeftIcon, PlusIcon, TrashIcon, BookIcon, XIcon, ResizeGripIcon, DotsVerticalIcon, ChevronDownIcon, UndoIcon, RedoIcon } from './icons';

// --- Reusable Input Components ---

const AutoSizingTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { onChange: (value: string) => void }> = ({ value, onChange, className, ...props }) => {
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

const EditableVideoSection: React.FC<{
    url: string | undefined;
    onUrlChange: (newUrl: string) => void;
    width: number | undefined;
    onWidthChange: (newWidth: number) => void;
}> = ({ url, onUrlChange, width, onWidthChange }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceTimeoutRef = useRef<number | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const videoRef = useRef<HTMLDivElement>(null);

    const startVideoResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const videoNode = videoRef.current;
        if (!videoNode) return;

        const startWidth = videoNode.offsetWidth;
        const parentWidth = videoNode.parentElement?.offsetWidth || startWidth;

        const doDrag = (moveEvent: MouseEvent | TouchEvent) => {
            const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const newWidth = startWidth + (currentX - startX);
            const newWidthPercent = Math.max(20, Math.min((newWidth / parentWidth) * 100, 100));
            onWidthChange(newWidthPercent);
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
    }, [onWidthChange]);


    const fetchThumbnail = async (videoUrl: string) => {
        if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
            setThumbnailUrl(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        // YouTube
        let match = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (match && match[1]) {
            setThumbnailUrl(`https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`);
            setIsLoading(false);
            return;
        }

        // Vimeo
        match = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/);
        if (match && match[1]) {
            try {
                const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`);
                if (!response.ok) throw new Error('Vimeo API error');
                const data = await response.json();
                setThumbnailUrl(data.thumbnail_url);
            } catch (err) {
                console.error("Failed to fetch Vimeo thumbnail", err);
                setThumbnailUrl(null);
                setError('Could not fetch Vimeo thumbnail.');
            } finally {
                setIsLoading(false);
            }
            return;
        }
        
        setThumbnailUrl(null);
        setError(videoUrl.trim() ? 'Invalid YouTube or Vimeo URL.' : null);
        setIsLoading(false);
    };

    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = window.setTimeout(() => {
            fetchThumbnail(url || '');
        }, 500);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [url]);

    return (
        <div>
            <input 
                type="text" 
                value={url || ''} 
                onChange={e => onUrlChange(e.target.value)} 
                placeholder="Video URL (YouTube, Vimeo)" 
                className="w-full p-2 border border-gray-300 rounded-md bg-brand-primary mb-2" 
            />
            {isLoading && <div className="w-full aspect-video bg-gray-200 animate-pulse rounded-md" />}
            {error && <p className="text-sm text-red-600 px-1">{error}</p>}
            {thumbnailUrl && !isLoading && (
                 <div ref={videoRef} className="relative inline-block" style={{ width: `${width || 100}%` }}>
                    <div className={`relative mt-2 transition-shadow ${isResizing ? 'shadow-2xl ring-2 ring-blue-500' : ''}`}>
                        <img src={thumbnailUrl} alt="Video Thumbnail" className="w-full aspect-video object-cover rounded-md" />
                    </div>
                    <div
                        onMouseDown={startVideoResize}
                        onTouchStart={startVideoResize}
                        className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-full border-2 border-blue-500 cursor-nwse-resize flex items-center justify-center touch-none"
                    >
                        <ResizeGripIcon className="w-4 h-4 text-blue-600" />
                    </div>
                 </div>
            )}
        </div>
    );
};


// --- Section Editor Component ---

const SectionEditor: React.FC<{
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

const FloatingSectionEditor: React.FC<{
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

// --- Column Component ---

interface EditableColumnProps {
    column: PathColumn;
    activeItemId: string | null;
    isFirstColumn: boolean;
    onItemSelect: (columnId: string, itemId: string) => void;
    updateColumn: (id: string, data: Partial<PathColumn>) => void;
    onDeleteColumn: (column: PathColumn) => void;
    addItem: (columnId: string) => void;
    updateItem: (columnId: string, itemId: string, title: string) => void;
    deleteItem: (columnId: string, itemId: string) => void;
    addSection: (columnId: string, type: SectionType) => void;
    addBranch: (columnId: string) => void;
    updateSectionContent: (columnId: string, sectionId: string, content: any) => void;
    deleteSection: (columnId: string, sectionId: string) => void;
    updateSectionsOrder: (columnId: string, sections: DynamicContentSection[]) => void;
    showColumnHeader: boolean;
    isMobile: boolean;
}

const EditableColumn: React.FC<EditableColumnProps> = (props) => {
    const { column, activeItemId, isFirstColumn, onItemSelect, updateColumn, onDeleteColumn, addItem, updateItem, deleteItem, addSection, addBranch, updateSectionContent, deleteSection, updateSectionsOrder, showColumnHeader, isMobile } = props;
    const dynamicColumnRef = useRef<HTMLDivElement>(null);

    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
    const [draggableSectionId, setDraggableSectionId] = useState<string | null>(null);
    const longPressTimerRef = useRef<number | null>(null);
    const isScrollingRef = useRef(false);


    const handleDragStart = (e: React.DragEvent, sectionId: string) => {
        setDraggedSectionId(sectionId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault();
        if (!draggedSectionId) return;

        const sections = [...column.sections];
        const draggedIndex = sections.findIndex(s => s.id === draggedSectionId);
        const targetIndex = sections.findIndex(s => s.id === targetSectionId);

        if (draggedIndex > -1 && targetIndex > -1) {
            const [draggedItem] = sections.splice(draggedIndex, 1);
            sections.splice(targetIndex, 0, draggedItem);
            updateSectionsOrder(column.id, sections.filter(s => s.type !== SectionType.FLOATING));
        }
        setDraggedSectionId(null);
    };

    const handleTouchStart = (sectionId: string) => {
        isScrollingRef.current = false;
        longPressTimerRef.current = window.setTimeout(() => {
            if (!isScrollingRef.current) {
                setDraggableSectionId(sectionId);
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        }, 500);
    };

    const handleTouchMove = () => {
        isScrollingRef.current = true;
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleTouchEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        setTimeout(() => {
            if (draggedSectionId === null) {
               setDraggableSectionId(null);
            }
        }, 100);
    };
    
    return (
        <div className="w-full h-full flex flex-col bg-brand-secondary">
            {showColumnHeader && (
                <div className="flex-shrink-0 flex items-center justify-between p-4 h-20 border-b border-brand-accent">
                    <AutoSizingTextArea
                        value={column.title}
                        onChange={(val) => updateColumn(column.id, { title: val })}
                        className="font-bold text-lg bg-transparent border-none focus:ring-0 p-0 w-full"
                        rows={1}
                    />
                    {!isFirstColumn && (
                         <button onClick={() => onDeleteColumn(column)} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0">
                            <DotsVerticalIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}
            
            <div className="flex-grow overflow-y-auto no-scrollbar relative" ref={dynamicColumnRef}>
                {column.type === ColumnType.BRANCH ? (
                    <div className="space-y-2 py-4">
                        {column.items.map(item => (
                            <div key={item.id} className={`mx-4 p-2 rounded-lg transition-colors group relative ${activeItemId === item.id ? 'bg-brand-accent ring-2 ring-gray-400' : 'bg-brand-primary hover:bg-brand-secondary'}`}>
                                <AutoSizingTextArea 
                                    value={item.title}
                                    onChange={val => updateItem(column.id, item.id, val)}
                                    onFocus={() => onItemSelect(column.id, item.id)}
                                    className="w-full bg-transparent border-none p-1 focus:ring-0 cursor-pointer"
                                    rows={1}
                                />
                                <button onClick={() => deleteItem(column.id, item.id)} className="absolute top-1/2 -translate-y-1/2 right-2 p-1 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                         <button onClick={() => addItem(column.id)} className="w-[calc(100%-2rem)] mx-4 p-3 mt-2 text-center text-gray-600 bg-brand-primary rounded-lg hover:bg-brand-accent border border-gray-200 shadow-sm">
                            + Add
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="pb-4">
                           {column.sections.filter(s => s.type !== SectionType.FLOATING).map(section => (
                                <div 
                                    key={section.id}
                                    draggable={!isMobile || draggableSectionId === section.id}
                                    onDragStart={(e) => handleDragStart(e, section.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => {
                                        handleDrop(e, section.id);
                                        if (isMobile) setDraggableSectionId(null);
                                    }}
                                    onDragEnd={() => {
                                        if (isMobile) setDraggableSectionId(null);
                                        setDraggedSectionId(null);
                                    }}
                                    onTouchStart={isMobile ? () => handleTouchStart(section.id) : undefined}
                                    onTouchMove={isMobile ? handleTouchMove : undefined}
                                    onTouchEnd={isMobile ? handleTouchEnd : undefined}
                                    className="cursor-move"
                                >
                                    <SectionEditor 
                                        section={section} 
                                        updateSectionContent={(id, content) => updateSectionContent(column.id, id, content)}
                                        deleteSection={id => deleteSection(column.id, id)}
                                        isDragging={draggedSectionId === section.id || (isMobile && draggableSectionId === section.id)}
                                    />
                                </div>
                            ))}
                            {column.items.length > 0 && <div className="px-4 pt-4 mt-4 border-t border-brand-accent"></div>}
                            {column.items.map(item => (
                                <div key={item.id} className={`mx-4 mb-2 p-2 rounded-lg transition-colors group relative border border-gray-300 ${activeItemId === item.id ? 'bg-brand-accent ring-2 ring-gray-400' : 'bg-brand-primary hover:bg-brand-secondary'}`}>
                                    <AutoSizingTextArea 
                                        value={item.title}
                                        onChange={val => updateItem(column.id, item.id, val)}
                                        onFocus={() => onItemSelect(column.id, item.id)}
                                        className="w-full bg-transparent border-none p-1 focus:ring-0 cursor-pointer font-medium text-gray-800"
                                        rows={1}
                                        placeholder="Title for new column..."
                                    />
                                    <button onClick={() => deleteItem(column.id, item.id)} className="absolute top-1/2 -translate-y-1/2 right-2 p-1 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {column.sections.filter(s => s.type === SectionType.FLOATING).map(section => (
                            <FloatingSectionEditor
                                key={section.id}
                                section={section}
                                updateSectionContent={(id, content) => updateSectionContent(column.id, id, content)}
                                deleteSection={id => deleteSection(column.id, id)}
                                containerRef={dynamicColumnRef}
                            />
                        ))}
                    </>
                )}
            </div>
            {column.type === ColumnType.DYNAMIC && (
                <AddSectionPalette onAdd={type => type === ADD_BRANCH_ACTION ? addBranch(column.id) : addSection(column.id, type as SectionType)} />
            )}
        </div>
    );
};

const ADD_BRANCH_ACTION = 'ADD_BRANCH_ACTION';

const AddSectionPalette: React.FC<{ onAdd: (type: SectionType | typeof ADD_BRANCH_ACTION) => void }> = ({ onAdd }) => {
    const sectionTypes = Object.values(SectionType);
    return (
        <div className="flex-shrink-0 mt-auto p-2 border-t border-brand-accent bg-brand-secondary">
             <div className="flex flex-wrap gap-2 justify-center">
                {sectionTypes.map(type => (
                    <button key={type} onClick={() => onAdd(type)} className="px-3 py-1 text-xs bg-brand-primary border border-gray-300 rounded-full hover:bg-brand-accent hover:border-gray-400">
                        + {type.charAt(0) + type.slice(1).toLowerCase().replace("_", "-")}
                    </button>
                ))}
            </div>
            <button onClick={() => onAdd(ADD_BRANCH_ACTION)} className="w-full mt-2 px-3 py-2 text-sm bg-blue-100 text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-200 font-semibold flex items-center justify-center gap-2">
                <PlusIcon className="w-4 h-4" /> New Content Column
            </button>
        </div>
    )
};


const AddColumnPanel: React.FC<{ isActive: boolean; onCreate: (type: ColumnType) => void; isMobile?: boolean }> = ({ isActive, onCreate, isMobile = false }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleCreate = (type: ColumnType) => {
        onCreate(type);
        setIsMenuOpen(false);
    };
    
    if (isMobile) {
        return (
            <div className="relative">
                <button
                    onClick={() => isActive && setIsMenuOpen(prev => !prev)}
                    disabled={!isActive}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 bg-brand-text text-brand-primary shadow-lg hover:bg-gray-800"
                >
                    <PlusIcon className="w-8 h-8" />
                </button>
                {isMenuOpen && (
                    <div className="absolute z-10 bottom-full right-0 mb-2 w-48 bg-brand-primary rounded-md shadow-lg border border-brand-accent p-2 space-y-2">
                        <p className="text-xs text-gray-500 px-2">Add new column:</p>
                        <button onClick={() => handleCreate(ColumnType.BRANCH)} className="w-full flex items-center p-2 text-sm rounded-md hover:bg-brand-secondary">
                            <BookIcon className="w-4 h-4 mr-2" /> Branch
                        </button>
                        <button onClick={() => handleCreate(ColumnType.DYNAMIC)} className="w-full flex items-center p-2 text-sm rounded-md hover:bg-brand-secondary">
                            <PlusIcon className="w-4 h-4 mr-2" /> Content
                        </button>
                    </div>
                )}
            </div>
        );
    }


    return (
        <div className="flex-shrink-0 h-full flex items-center justify-center relative border-r border-brand-accent" style={{ width: 120 }}>
            <button
                onClick={() => isActive && setIsMenuOpen(prev => !prev)}
                disabled={!isActive}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'bg-brand-secondary hover:bg-brand-accent cursor-pointer' : 'bg-gray-100 cursor-not-allowed'
                }`}
            >
                <PlusIcon className={`w-8 h-8 ${isActive ? 'text-brand-text' : 'text-gray-400'}`} />
            </button>

            {isMenuOpen && (
                <div className="absolute z-10 top-1/2 -translate-y-1/2 left-full ml-2 w-48 bg-brand-primary rounded-md shadow-lg border border-brand-accent p-2 space-y-2">
                    <p className="text-xs text-gray-500 px-2">Add new column:</p>
                    <button onClick={() => handleCreate(ColumnType.BRANCH)} className="w-full flex items-center p-2 text-sm rounded-md hover:bg-brand-secondary">
                        <BookIcon className="w-4 h-4 mr-2" /> Branch
                    </button>
                    <button onClick={() => handleCreate(ColumnType.DYNAMIC)} className="w-full flex items-center p-2 text-sm rounded-md hover:bg-brand-secondary">
                        <PlusIcon className="w-4 h-4 mr-2" /> Content
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Main View ---

interface EditPathViewProps {
  pathId: string;
  onBack: () => void;
  isMobile: boolean;
}

const EditPathView: React.FC<EditPathViewProps> = ({ pathId, onBack, isMobile }) => {
    const { getPathById, updatePath } = usePaths();
    const [path, setPath] = useState<LearningPath | null>(null);
    const [activeItemIds, setActiveItemIds] = useState<Record<string, string | null>>({});
    const [isSaved, setIsSaved] = useState(true);
    const [columnToDelete, setColumnToDelete] = useState<PathColumn | null>(null);

    const [history, setHistory] = useState<LearningPath[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    useEffect(() => {
        const foundPath = getPathById(pathId);
        if (foundPath) {
            const initialPath = JSON.parse(JSON.stringify(foundPath));
            setPath(initialPath);
            setHistory([initialPath]);
            setHistoryIndex(0);
            setIsSaved(true);
        }
    }, [pathId, getPathById]);

    const commitChange = (updater: (draft: LearningPath) => void) => {
        setIsSaved(false);
        const currentPath = history[historyIndex];
        if (!currentPath) return;

        const newPath = JSON.parse(JSON.stringify(currentPath));
        updater(newPath);
        
        const newHistory = history.slice(0, historyIndex + 1);
        
        setHistory([...newHistory, newPath]);
        setHistoryIndex(newHistory.length);
        setPath(newPath);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setPath(history[newIndex]);
            setIsSaved(false);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setPath(history[newIndex]);
            setIsSaved(false);
        }
    };

    const handleSave = useCallback(() => {
        const currentPath = history[historyIndex];
        if (currentPath) {
            updatePath(currentPath);
            setIsSaved(true);
        }
    }, [history, historyIndex, updatePath]);
    
    const handleBack = () => {
        if (!isSaved) {
            handleSave();
        }
        onBack();
    };
    
    const deleteColumnAndDescendants = (pathDraft: LearningPath, startColumnId: string) => {
        const columnsToDelete = new Set<string>();
        const queue: string[] = [startColumnId];
        const processed = new Set<string>();

        while (queue.length > 0) {
            const currentColumnId = queue.shift()!;
            if (processed.has(currentColumnId)) continue;
            
            processed.add(currentColumnId);
            columnsToDelete.add(currentColumnId);

            const currentColumn = pathDraft.columns.find(c => c.id === currentColumnId);
            if (!currentColumn) continue;

            const itemIds = currentColumn.items.map(item => item.id);
            if (itemIds.length === 0) continue;
            
            pathDraft.columns.forEach(col => {
                if (col.parentItemId && itemIds.includes(col.parentItemId)) {
                    if (!processed.has(col.id)) {
                       queue.push(col.id);
                    }
                }
            });
        }
        pathDraft.columns = pathDraft.columns.filter(c => !columnsToDelete.has(c.id));
    };

    const deleteColumn = (id: string) => commitChange(p => {
        deleteColumnAndDescendants(p, id);
    });

    const handleConfirmDeleteColumn = () => {
        if (columnToDelete) {
            deleteColumn(columnToDelete.id);
            setColumnToDelete(null);
        }
    };

    const updateColumn = (id: string, data: Partial<PathColumn>) => commitChange(p => {
        const col = p.columns.find(c => c.id === id);
        if (col) {
            Object.assign(col, data);

            // If the title changed, sync the parent item
            if (data.title !== undefined && col.parentItemId) {
                const parentColumn = p.columns.find(c => c.items.some(item => item.id === col.parentItemId));
                if (parentColumn) {
                    const parentItem = parentColumn.items.find(item => item.id === col.parentItemId);
                    if (parentItem) {
                        parentItem.title = data.title;
                    }
                }
            }
        }
    });
        
    const addItem = (columnId: string) => commitChange(p => {
        const col = p.columns.find(c => c.id === columnId);
        if (col) {
            col.items.push({ id: crypto.randomUUID(), title: 'New Topic' });
        }
    });
    
    const updateItem = (columnId: string, itemId: string, title: string) => commitChange(p => {
        const col = p.columns.find(c => c.id === columnId);
        const item = col?.items.find(i => i.id === itemId);
        if (item) {
            item.title = title;
        }
    
        const childCol = p.columns.find(c => c.parentItemId === itemId);
        if (childCol) {
            childCol.title = title;
        }
    });

    const deleteItem = (columnId: string, itemId: string) => commitChange(p => {
        const col = p.columns.find(c => c.id === columnId);
        if (col) {
            col.items = col.items.filter(i => i.id !== itemId);
        }
        const childCol = p.columns.find(c => c.parentItemId === itemId);
        if (childCol) {
            deleteColumnAndDescendants(p, childCol.id);
        }
    });

    const addSection = (columnId: string, type: SectionType) => commitChange(p => {
        const col = p.columns.find(c => c.id === columnId);
        if (col) {
            let content: any = {};
            switch(type) {
                case SectionType.HEADING: content = { text: 'New Heading' }; break;
                case SectionType.SUB_HEADING: content = { text: 'New Sub-heading' }; break;
                case SectionType.PARAGRAPH: content = { text: 'New paragraph.' }; break;
                case SectionType.IMAGE: content = { src: '', width: 100 }; break;
                case SectionType.VIDEO: content = { url: '', width: 100 }; break;
                case SectionType.BULLETS: content = { ordered: false, items: ['First item'] }; break;
                case SectionType.QANDA: content = { question: 'Question?', answer: 'Answer.', isCollapsed: false }; break;
                case SectionType.LINK: content = { text: 'Link Text', url: 'https://' }; break;
                case SectionType.FLOATING: content = { text: 'Floating note', x: 20, y: 20, width: 200, height: 100 }; break;
            }
            col.sections.push({ id: crypto.randomUUID(), type, content });
        }
    });

    const addBranchFromDynamicColumn = (columnId: string) => commitChange(p => {
        const parentCol = p.columns.find(c => c.id === columnId);
        if (!parentCol || parentCol.type !== ColumnType.DYNAMIC) return;

        const newItem: PathItem = { id: crypto.randomUUID(), title: 'New Content' };
        parentCol.items.push(newItem);

        p.columns.push({
            id: crypto.randomUUID(),
            title: newItem.title,
            type: ColumnType.DYNAMIC,
            parentItemId: newItem.id,
            width: 320,
            items: [],
            sections: []
        });
    });

    const updateSectionContent = (columnId: string, sectionId: string, content: any) => commitChange(p => {
        const col = p.columns.find(c => c.id === columnId);
        const section = col?.sections.find(s => s.id === sectionId);
        if (section) section.content = content;
    });
    
    const updateSectionsOrder = (columnId: string, reorderedSections: DynamicContentSection[]) => commitChange(p => {
        const col = p.columns.find(c => c.id === columnId);
        if (col) {
            const floatingSections = col.sections.filter(s => s.type === SectionType.FLOATING);
            col.sections = [...reorderedSections, ...floatingSections];
        }
    });

    const deleteSection = (columnId: string, sectionId: string) => commitChange(p => {
        const col = p.columns.find(c => c.id === columnId);
        if (col) col.sections = col.sections.filter(s => s.id !== sectionId);
    });

    const addColumn = (parentItemId: string, type: ColumnType) => commitChange(p => {
        const parentItem = p.columns.flatMap(c => c.items).find(i => i.id === parentItemId);
        p.columns.push({
            id: crypto.randomUUID(),
            title: parentItem?.title || (type === ColumnType.BRANCH ? 'New Phase' : 'New Content'),
            type,
            parentItemId,
            width: 320,
            items: [],
            sections: []
        });
    });

    const startResizing = useCallback((e: React.MouseEvent, columnId: string) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = path?.columns.find(c => c.id === columnId)?.width || 320;
        
        const doDrag = (moveEvent: MouseEvent) => {
            const newWidth = startWidth + moveEvent.clientX - startX;
            commitChange(p => {
                const col = p.columns.find(c => c.id === columnId);
                if (col) col.width = Math.max(240, newWidth);
            });
        };
        const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        };
        
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }, [path, history, historyIndex]);

    const handleItemSelect = (columnId: string, itemId: string) => {
        setActiveItemIds(prev => {
            const newActiveIds: Record<string, string | null> = {};
            if (!path) return prev;
            
            let currentColumn = path.columns.find(c => c.id === columnId);
            if (!currentColumn) return prev;
            
            // Trace back to the root to build the path of active columns
            const trace: PathColumn[] = [];
            while(currentColumn) {
                trace.unshift(currentColumn);
                const parentItemId = currentColumn.parentItemId;
                if (!parentItemId) break;
                currentColumn = path.columns.find(c => c.items.some(i => i.id === parentItemId));
            }

            // Keep active IDs up to the clicked column's parent
            for (const col of trace) {
                if (col.id !== columnId && prev[col.id]) {
                    newActiveIds[col.id] = prev[col.id];
                }
            }

            // Toggle the selected item in the clicked column
            newActiveIds[columnId] = prev[columnId] === itemId ? null : itemId;

            return newActiveIds;
        });
    };
    
    const visibleColumns: PathColumn[] = [];
    let lastActiveItemId: string | null = null;
    if (path) {
        const rootColumn = path.columns.find(c => c.parentItemId === null);
        if (rootColumn) {
            visibleColumns.push(rootColumn);
            let activeItemIdInHierarchy = activeItemIds[rootColumn.id];
            if(activeItemIdInHierarchy) lastActiveItemId = activeItemIdInHierarchy;

            while (activeItemIdInHierarchy) {
                const childCol = path.columns.find(c => c.parentItemId === activeItemIdInHierarchy);
                if (childCol) {
                    visibleColumns.push(childCol);
                    activeItemIdInHierarchy = activeItemIds[childCol.id];
                    if (activeItemIdInHierarchy) lastActiveItemId = activeItemIdInHierarchy;
                } else {
                    activeItemIdInHierarchy = null;
                }
            }
        }
    }
    
    const isAddColumnActive = lastActiveItemId && !path?.columns.some(c => c.parentItemId === lastActiveItemId);

    if (!path) {
        return <div className="flex items-center justify-center h-full">Loading path...</div>;
    }
    
    const renderMobileView = () => {
        if (visibleColumns.length === 0) return null;
        
        const currentColumn = visibleColumns[visibleColumns.length - 1];
        const parentColumn = visibleColumns.length > 1 ? visibleColumns[visibleColumns.length - 2] : null;

        const handleMobileBack = () => {
            if (!parentColumn) return;
            
            setActiveItemIds(prev => {
                const newIds = {...prev};
                delete newIds[parentColumn.id];
                return newIds;
            });
        };
        
        return (
            <div className="h-full w-full flex flex-col">
                {parentColumn && (
                    <div className="flex-shrink-0 flex items-center gap-2 p-2 border-b border-brand-accent h-16 bg-brand-primary">
                        <button onClick={handleMobileBack} className="flex-shrink-0 p-2 text-gray-700 hover:bg-brand-secondary rounded-full">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="flex-grow min-w-0">
                             <AutoSizingTextArea
                                value={currentColumn.title}
                                onChange={(val) => updateColumn(currentColumn.id, { title: val })}
                                className="font-bold text-lg bg-transparent border-none focus:ring-0 p-1 w-full"
                                rows={1}
                            />
                        </div>
                        <button onClick={() => setColumnToDelete(currentColumn)} className="p-2 text-gray-500 hover:text-red-600 flex-shrink-0">
                            <DotsVerticalIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <div className="flex-grow h-full overflow-y-auto">
                    <EditableColumn 
                        column={currentColumn}
                        activeItemId={activeItemIds[currentColumn.id] ?? null}
                        isFirstColumn={visibleColumns.length === 1}
                        onItemSelect={handleItemSelect}
                        updateColumn={updateColumn}
                        onDeleteColumn={setColumnToDelete}
                        addItem={addItem}
                        updateItem={updateItem}
                        deleteItem={deleteItem}
                        addSection={addSection}
                        addBranch={addBranchFromDynamicColumn}
                        updateSectionContent={updateSectionContent}
                        deleteSection={deleteSection}
                        updateSectionsOrder={updateSectionsOrder}
                        showColumnHeader={!parentColumn} 
                        isMobile={isMobile}
                    />
                </div>
            </div>
        )
    };
    
    const renderDesktopView = () => (
        <>
            {visibleColumns.map((col, index) => (
                <div key={col.id} className="flex-shrink-0 h-full flex" style={{ width: col.width }}>
                   <div className="flex-grow h-full border-r border-brand-accent min-w-0">
                     <EditableColumn 
                        column={col}
                        activeItemId={activeItemIds[col.id] ?? null}
                        isFirstColumn={index === 0}
                        onItemSelect={handleItemSelect}
                        updateColumn={updateColumn}
                        onDeleteColumn={setColumnToDelete}
                        addItem={addItem}
                        updateItem={updateItem}
                        deleteItem={deleteItem}
                        addSection={addSection}
                        addBranch={addBranchFromDynamicColumn}
                        updateSectionContent={updateSectionContent}
                        deleteSection={deleteSection}
                        updateSectionsOrder={updateSectionsOrder}
                        showColumnHeader={true}
                        isMobile={isMobile}
                    />
                   </div>
                     <div onMouseDown={(e) => startResizing(e, col.id)} className="w-2 h-full cursor-col-resize flex items-center justify-center group flex-shrink-0">
                      <div className="w-px h-full bg-brand-accent group-hover:bg-blue-500 transition-colors"></div>
                    </div>
                </div>
            ))}
             <AddColumnPanel
                isActive={!!isAddColumnActive}
                onCreate={(type) => {
                    if (lastActiveItemId) {
                        addColumn(lastActiveItemId, type);
                    }
                }}
            />
        </>
    );

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return (
        <div className="h-full w-full flex flex-col bg-brand-primary text-brand-text">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-brand-accent h-16">
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    <button onClick={handleBack} className="p-2 hover:bg-brand-secondary rounded-full">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <AutoSizingTextArea 
                      value={path.title}
                      onChange={val => commitChange(p => { p.title = val; })}
                      className="text-xl md:text-2xl font-bold bg-transparent border-none focus:ring-0 p-0"
                      rows={1}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleUndo} disabled={!canUndo} className="p-2 rounded-full hover:bg-brand-secondary disabled:text-gray-300 disabled:hover:bg-transparent">
                        <UndoIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleRedo} disabled={!canRedo} className="p-2 rounded-full hover:bg-brand-secondary disabled:text-gray-300 disabled:hover:bg-transparent">
                        <RedoIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleSave} disabled={isSaved} className={`px-4 md:px-5 py-2 text-sm md:text-base font-semibold rounded-lg shadow-sm transition-colors ${
                        isSaved ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-brand-text text-brand-primary hover:bg-gray-800'
                    }`}>
                        {isSaved ? 'Saved' : 'Save'}
                    </button>
                </div>
            </header>
            <main className="flex-grow flex items-start overflow-auto no-scrollbar">
                {isMobile ? renderMobileView() : renderDesktopView()}
            </main>
            
            {columnToDelete && (
                 <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center" onClick={() => setColumnToDelete(null)}>
                    <div className="bg-brand-primary rounded-lg shadow-xl p-6 w-full max-w-sm m-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold">Delete Column?</h3>
                        <p className="text-gray-600 my-4">Are you sure you want to delete the column "{columnToDelete.title}" and all of its nested content? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setColumnToDelete(null)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-brand-secondary">Cancel</button>
                            <button onClick={handleConfirmDeleteColumn} className="px-4 py-2 rounded-lg bg-brand-text text-brand-primary hover:bg-gray-800">Delete</button>
                        </div>
                    </div>
                </div>
            )}
            
            {isMobile && isAddColumnActive && (
                <div className="fixed bottom-6 right-6 z-20">
                    <AddColumnPanel
                        isMobile
                        isActive={true}
                        onCreate={(type) => {
                            if (lastActiveItemId) {
                                addColumn(lastActiveItemId, type);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default EditPathView;