import React, { useState, useRef } from 'react';
import { PathColumn, PathItem, DynamicContentSection, ColumnType, SectionType } from '../../types';
import { TrashIcon, DotsVerticalIcon } from '../icons';
import { AutoSizingTextArea } from '../common/AutoSizingTextArea';
import { SectionEditor } from './SectionEditor';
import { FloatingSectionEditor } from './FloatingSectionEditor';
import { AddSectionPalette, ADD_BRANCH_ACTION } from './AddSectionPalette';

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

export const EditableColumn: React.FC<EditableColumnProps> = (props) => {
    const { column, activeItemId, isFirstColumn, onItemSelect, updateColumn, onDeleteColumn, addItem, updateItem, deleteItem, addSection, addBranch, updateSectionContent, deleteSection, updateSectionsOrder, showColumnHeader, isMobile } = props;
    const dynamicColumnRef = useRef<HTMLDivElement>(null);

    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

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

    const handleBackgroundClick = () => {
        setSelectedSectionId(null);
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
            
            <div className="flex-grow overflow-y-auto no-scrollbar relative" ref={dynamicColumnRef} onClick={handleBackgroundClick}>
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
                        <div className="py-2 space-y-1">
                           {column.sections.filter(s => s.type !== SectionType.FLOATING).map(section => (
                                <div 
                                    key={section.id}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, section.id)}
                                >
                                    <SectionEditor 
                                        section={section} 
                                        updateSectionContent={(id, content) => updateSectionContent(column.id, id, content)}
                                        deleteSection={id => deleteSection(column.id, id)}
                                        isSelected={selectedSectionId === section.id}
                                        onSelect={(e, id) => {
                                            e.stopPropagation();
                                            setSelectedSectionId(id);
                                        }}
                                        onDragStart={handleDragStart}
                                        isMobile={isMobile}
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
                <AddSectionPalette onAdd={type => {
                    if (type === ADD_BRANCH_ACTION) {
                        addBranch(column.id);
                    } else {
                        addSection(column.id, type as SectionType)
                    }
                }} />
            )}
        </div>
    );
};