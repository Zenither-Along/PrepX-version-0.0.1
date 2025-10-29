import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DynamicContentSection, SectionType } from '../../types';
import { XIcon, ResizeGripIcon, ChevronDownIcon } from '../icons';
import { AutoSizingTextArea } from '../common/AutoSizingTextArea';
import { EditableVideoSection } from './EditableVideoSection';
import { EditableTableSection } from './EditableTableSection';

export const SectionEditor: React.FC<{
    section: DynamicContentSection;
    updateSectionContent: (id: string, content: any) => void;
    deleteSection: (id: string) => void;
    isSelected: boolean;
    onSelect: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
    onDragStart: (e: React.DragEvent, sectionId: string) => void;
    isMobile: boolean;
}> = ({ section, updateSectionContent, deleteSection, isSelected, onSelect, onDragStart, isMobile }) => {
    const [editingField, setEditingField] = useState<string | null>(null);
    const isEditing = editingField !== null;
    
    const [isResizing, setIsResizing] = useState(false);
    const imageRef = useRef<HTMLDivElement>(null);

    const textRef = useRef<HTMLTextAreaElement>(null);
    const questionRef = useRef<HTMLTextAreaElement>(null);
    const answerRef = useRef<HTMLTextAreaElement>(null);
    const linkTextRef = useRef<HTMLTextAreaElement>(null);
    const linkUrlRef = useRef<HTMLInputElement>(null);
    const listItemRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

    useEffect(() => {
        if (!isSelected) return;
        
        const focusAndSelect = (el: HTMLElement | null) => {
            if (el) {
                el.focus();
                if ('select' in el && typeof el.select === 'function') {
                    (el as HTMLInputElement | HTMLTextAreaElement).select();
                }
            }
        };

        switch (editingField) {
            case 'text': focusAndSelect(textRef.current); break;
            case 'question': focusAndSelect(questionRef.current); break;
            case 'answer': focusAndSelect(answerRef.current); break;
            case 'linkText': focusAndSelect(linkTextRef.current); break;
            case 'linkUrl': focusAndSelect(linkUrlRef.current); break;
            default:
                if (editingField && editingField.startsWith('listItem-')) {
                    focusAndSelect(listItemRefs.current[editingField]);
                }
                break;
        }
    }, [editingField, isSelected]);

    useEffect(() => {
        if (!isSelected && isEditing) {
            setEditingField(null);
        }
    }, [isSelected, isEditing]);

    const handleFieldClick = (e: React.MouseEvent | React.TouchEvent, field: string) => {
        e.stopPropagation();
        if (isSelected) {
            setEditingField(field);
        } else {
            onSelect(e, section.id);
        }
    };
    
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
        const createTextInputProps = (field: string, ref: React.Ref<any>) => ({
            ref,
            readOnly: editingField !== field,
            onBlur: () => setEditingField(null),
            className: `border-none focus:ring-0 bg-transparent w-full ${editingField !== field ? 'pointer-events-none' : ''}`
        });

        switch (section.type) {
            case SectionType.HEADING:
                return <div onClick={(e) => handleFieldClick(e, 'text')}><AutoSizingTextArea value={section.content?.text || ''} onChange={text => handleUpdate({ text })} placeholder="Heading" {...createTextInputProps('text', textRef)} className={`${createTextInputProps('text', textRef).className} text-2xl font-bold p-0`} rows={1} /></div>;
            case SectionType.SUB_HEADING:
                return <div onClick={(e) => handleFieldClick(e, 'text')}><AutoSizingTextArea value={section.content?.text || ''} onChange={text => handleUpdate({ text })} placeholder="Sub-heading" {...createTextInputProps('text', textRef)} className={`${createTextInputProps('text', textRef).className} text-xl font-semibold text-gray-700 p-0`} rows={1} /></div>;
            case SectionType.PARAGRAPH:
                return <div onClick={(e) => handleFieldClick(e, 'text')}><AutoSizingTextArea value={section.content?.text || ''} onChange={text => handleUpdate({ text })} placeholder="Paragraph" {...createTextInputProps('text', textRef)} className={`${createTextInputProps('text', textRef).className} p-0 bg-brand-primary`} /></div>;
            case SectionType.IMAGE:
                 return (
                    <div className="relative group/image">
                        {section.content?.src ? (
                            <div className="p-4 rounded-md">
                                <div ref={imageRef} className="relative inline-block" style={{ width: `${section.content.width || 100}%` }}>
                                    <img src={section.content.src} alt="content" className={`w-full h-auto transition-shadow ${isResizing ? 'shadow-2xl ring-2 ring-blue-500' : ''}`}/>
                                    {isSelected && (
                                        <div
                                          onMouseDown={startImageResize}
                                          onTouchStart={startImageResize}
                                          className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-full border-2 border-blue-500 cursor-nwse-resize flex items-center justify-center touch-none"
                                        >
                                            <ResizeGripIcon className="w-4 h-4 text-blue-600" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" onClick={e => e.stopPropagation()} />
                        )}
                    </div>
                );
            case SectionType.VIDEO:
                return (
                    <div>
                        <EditableVideoSection
                            content={section.content}
                            onContentChange={handleUpdate}
                            isSelected={isSelected}
                        />
                    </div>
                );
            case SectionType.BULLETS:
                 return (
                    <div className="space-y-1">
                        {isSelected && (
                            <div className="flex items-center gap-4 mb-2" onClick={e => e.stopPropagation()}>
                                <label className="flex items-center text-sm">
                                    <input type="checkbox" checked={section.content?.ordered || false} onChange={e => handleUpdate({ ordered: e.target.checked })} className="mr-2"/>
                                    Numbered List
                                </label>
                            </div>
                        )}
                        {section.content?.items?.map((item: string, index: number) => {
                            const fieldName = `listItem-${index}`;
                            return (
                                <div key={index} className="flex items-center gap-2" onClick={(e) => handleFieldClick(e, fieldName)}>
                                    <span className="text-gray-500 pt-1">{section.content.ordered ? `${index + 1}.` : '•'}</span>
                                    <AutoSizingTextArea value={item} onChange={val => {
                                        const newItems = [...section.content.items];
                                        newItems[index] = val;
                                        handleUpdate({ items: newItems });
                                    }} {...createTextInputProps(fieldName, (el) => listItemRefs.current[fieldName] = el)} className={`${createTextInputProps(fieldName, null).className} w-full p-1`} rows={1} />
                                    {isSelected && (
                                        <button onClick={(e) => { e.stopPropagation(); handleUpdate({ items: section.content.items.filter((_: any, i: number) => i !== index) }); }} className="p-1 text-gray-400 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
                                    )}
                                </div>
                            )
                        })}
                        {isSelected && (
                            <button onClick={(e) => { e.stopPropagation(); handleUpdate({ items: [...(section.content?.items || []), ''] }); }} className="text-sm text-gray-600 hover:text-gray-900 mt-2 ml-4">+ Add item</button>
                        )}
                    </div>
                );
            case SectionType.QANDA:
                const isCollapsed = section.content?.isCollapsed || false;
                return (
                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-start gap-2" onClick={(e) => handleFieldClick(e, 'question')}>
                            <span className="font-bold text-gray-500 pt-1">Q:</span>
                            <AutoSizingTextArea {...createTextInputProps('question', questionRef)} value={section.content?.question || ''} onChange={question => handleUpdate({ question })} placeholder="Question" className={`${createTextInputProps('question', questionRef).className} font-bold p-1 w-full flex-1`} rows={1} />
                        </div>
                         <div className="flex items-start gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleUpdate({ isCollapsed: !isCollapsed }); }}
                                className="p-1 rounded-full hover:bg-gray-200"
                            >
                                <ChevronDownIcon className={`w-5 h-5 mt-1 transition-transform flex-shrink-0 text-gray-500 ${!isCollapsed ? 'rotate-180' : ''}`} />
                            </button>
                            {!isCollapsed && (
                                <div className="flex-1" onClick={(e) => handleFieldClick(e, 'answer')}>
                                    <AutoSizingTextArea 
                                        {...createTextInputProps('answer', answerRef)}
                                        value={section.content?.answer || ''} 
                                        onChange={answer => handleUpdate({ answer })} 
                                        placeholder="Answer"
                                        className={`${createTextInputProps('answer', answerRef).className} p-1`}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );
            case SectionType.LINK:
                 return (
                    <div className="space-y-2 border p-3 rounded-lg">
                        <div onClick={(e) => handleFieldClick(e, 'linkText')}>
                            <AutoSizingTextArea {...createTextInputProps('linkText', linkTextRef)} value={section.content?.text || ''} onChange={text => handleUpdate({ text })} placeholder="Link Text" className={`${createTextInputProps('linkText', linkTextRef).className} font-medium p-1 w-full`} rows={1} />
                        </div>
                         <div onClick={(e) => handleFieldClick(e, 'linkUrl')}>
                            <input type="text" {...createTextInputProps('linkUrl', linkUrlRef)} value={section.content?.url || ''} onChange={e => handleUpdate({ url: e.target.value })} placeholder="URL (e.g., https://example.com)" className={`${createTextInputProps('linkUrl', linkUrlRef).className} text-sm text-blue-600 p-1 w-full`} />
                        </div>
                    </div>
                );
            case SectionType.TABLE:
                return (
                    <div>
                        <EditableTableSection
                            content={section.content}
                            onContentChange={handleUpdate}
                            isEditing={isEditing}
                            setIsEditing={(isEditingNow) => setEditingField(isEditingNow ? 'table' : null)}
                            isSelected={isSelected}
                            isMobile={isMobile}
                        />
                    </div>
                );
            default: return null;
        }
    };
    
    return (
        <div 
          className={`relative mx-2 my-1 p-2 rounded-md transition-shadow duration-200 ${isSelected ? 'ring-2 ring-blue-500 shadow-lg bg-white' : 'hover:bg-gray-100'} ${isSelected && !isEditing ? 'cursor-move' : ''}`}
          onClick={(e) => onSelect(e, section.id)}
          draggable={isSelected && !isEditing}
          onDragStart={(e) => onDragStart(e, section.id)}
        >
            {renderContentEditor()}
            {isSelected && (
                 <button onClick={() => deleteSection(section.id)} className="absolute -top-2 -right-2 p-1 bg-white rounded-full text-gray-400 hover:text-red-600 border border-gray-300 shadow-sm z-10">
                    <XIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};