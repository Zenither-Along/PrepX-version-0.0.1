import React, { useState, useCallback } from 'react';
import { ArrowLeftIcon, SparklesIcon } from '../icons';
import { LearningPath, PathColumn, ColumnType, SectionType } from '../../types';
import { BranchNavigation } from './BranchNavigation';
import { ReadOnlyDynamicColumn } from './ReadOnlyColumn';
import { AiAssistantColumn } from './AiAssistantColumn';

const extractTextFromColumn = (column: PathColumn): string => {
  if (!column || column.type !== ColumnType.DYNAMIC) return '';
  
  return column.sections
    .map(section => {
      switch (section.type) {
        case SectionType.HEADING: return `# ${section.content.text}`;
        case SectionType.SUB_HEADING: return `## ${section.content.text}`;
        case SectionType.PARAGRAPH: return section.content.text;
        case SectionType.BULLETS:
          const prefix = section.content.ordered ? '1.' : '-';
          return section.content.items.map((item: string) => `${prefix} ${item}`).join('\n');
        case SectionType.QANDA: return `Q: ${section.content.question}\nA: ${section.content.answer}`;
        case SectionType.LINK: return `Link: ${section.content.text} (${section.content.url})`;
        default: return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
};


export const PathViewer: React.FC<{ path: LearningPath; isMobile: boolean }> = ({ path, isMobile }) => {
    const [activeItemIds, setActiveItemIds] = useState<Record<string, string | null>>({});
    const [aiParentColumn, setAiParentColumn] = useState<PathColumn | null>(null);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
      Object.fromEntries(path.columns.map(c => [c.id, c.width]))
    );

    const startResizing = useCallback((e: React.MouseEvent, columnId: string) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = columnWidths[columnId] || 320;
        
        const doDrag = (moveEvent: MouseEvent) => {
            const newWidth = startWidth + moveEvent.clientX - startX;
            setColumnWidths(prev => ({ ...prev, [columnId]: Math.max(240, newWidth) }));
        };
        const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        };
        
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }, [columnWidths]);

    const handleItemSelect = (columnId: string, itemId: string) => {
        setAiParentColumn(null); // Clear AI when navigating
        const newActiveIds = { ...activeItemIds, [columnId]: itemId };
        // Clean up downstream active IDs
        let currentChild = path.columns.find(c => c.parentItemId === itemId);
        while (currentChild) {
            delete newActiveIds[currentChild.id];
            const nextItemId = activeItemIds[currentChild.id];
            if (!nextItemId) break;
            currentChild = path.columns.find(c => c.parentItemId === nextItemId);
        }
        setActiveItemIds(newActiveIds);
    };

    const handleAiButtonClick = (column: PathColumn) => {
        setAiParentColumn(column);
        // Clear any active items in the current column to ensure the AI column is the last one
        setActiveItemIds(prev => {
            const newIds = {...prev};
            delete newIds[column.id];
            return newIds;
        });
    };

    let columnsToRender: PathColumn[] = [];
    const rootColumn = path.columns.find(c => c.parentItemId === null);
    if (rootColumn) {
        columnsToRender.push(rootColumn);
        let activeItemId = activeItemIds[rootColumn.id];
        while (activeItemId) {
            const childCol = path.columns.find(c => c.parentItemId === activeItemId);
            if (childCol) {
                columnsToRender.push(childCol);
                activeItemId = activeItemIds[childCol.id];
            } else {
                activeItemId = null;
            }
        }
    }
    
    if (aiParentColumn) {
        const parentIndex = columnsToRender.findIndex(c => c.id === aiParentColumn.id);
        if (parentIndex !== -1) {
            columnsToRender = columnsToRender.slice(0, parentIndex + 1);
            const aiVirtualColumn: PathColumn = {
                id: `ai-assistant-${aiParentColumn.id}`,
                title: 'AI Assistant',
                type: 'AI' as any,
                parentItemId: aiParentColumn.id,
                width: 400,
                items: [],
                sections: [],
            };
            columnsToRender.push(aiVirtualColumn);
        }
    }
    
    const renderMobileView = () => {
        if (columnsToRender.length === 0) return null;
    
        const currentColumn = columnsToRender[columnsToRender.length - 1];
        const parentColumn = columnsToRender.length > 1 ? columnsToRender[columnsToRender.length - 2] : null;

        const handleMobileBack = () => {
            if (aiParentColumn) {
                setAiParentColumn(null);
                return;
            }
            if (!parentColumn) return;
            setActiveItemIds(prev => {
                const newIds = {...prev};
                delete newIds[parentColumn.id];
                return newIds;
            });
        };

        return (
            <div className="h-full w-full flex flex-col">
                <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-brand-accent h-16 bg-brand-primary">
                    <div className="flex items-center min-w-0">
                        {parentColumn ? (
                            <button onClick={handleMobileBack} className="flex-shrink-0 p-2 text-gray-700 hover:bg-brand-secondary rounded-full">
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                        ) : null}
                        <h2 className="font-bold text-lg px-2 truncate">{currentColumn.title}</h2>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center gap-2">
                        {currentColumn.type === ColumnType.DYNAMIC && (
                             <button onClick={() => handleAiButtonClick(currentColumn)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200">
                                <SparklesIcon className="w-4 h-4" />
                            </button>
                        )}
                        {currentColumn.type === ColumnType.DYNAMIC && currentColumn.items.length > 0 && (
                             <BranchNavigation
                                items={currentColumn.items}
                                path={path}
                                activeItemId={activeItemIds[currentColumn.id] ?? null}
                                onItemSelect={(itemId) => handleItemSelect(currentColumn.id, itemId)}
                            />
                        )}
                    </div>
                </div>
                
                <div className="w-full flex flex-col flex-grow overflow-y-auto">
                    {currentColumn.type === ColumnType.BRANCH ? (
                        <div className="flex-grow overflow-y-auto no-scrollbar bg-brand-secondary border-t border-brand-accent">
                            {currentColumn.items.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => handleItemSelect(currentColumn.id, item.id)}
                                    className={`w-full text-left border-b border-brand-accent transition-colors ${activeItemIds[currentColumn.id] === item.id ? 'bg-brand-accent' : 'bg-brand-primary hover:bg-brand-secondary'}`}
                                >
                                    <div className={`px-4 py-3 ${activeItemIds[currentColumn.id] === item.id ? 'font-semibold' : ''}`}>
                                        {item.title}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (currentColumn as any).type === 'AI' ? (
                        <AiAssistantColumn context={extractTextFromColumn(aiParentColumn!)} />
                    ) : (
                         <div className="flex-grow overflow-y-auto no-scrollbar">
                            <ReadOnlyDynamicColumn sections={currentColumn.sections} />
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    const renderDesktopView = () => (
        <>
            {columnsToRender.map((col, index) => (
                <div key={col.id} className="flex-shrink-0 h-full flex" style={{ width: columnWidths[col.id] || col.width }}>
                    <div className="w-full flex flex-col bg-brand-secondary border-r border-brand-accent min-w-0">
                        <div className="flex-shrink-0 flex items-center justify-between p-4 h-20 border-b border-brand-accent">
                            <h2 className="font-bold text-lg truncate">{col.title}</h2>
                            <div className="flex items-center gap-2">
                                {col.type === ColumnType.DYNAMIC && (
                                    <button onClick={() => handleAiButtonClick(col)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200">
                                        <SparklesIcon className="w-4 h-4" />
                                        <span>AI Assistant</span>
                                    </button>
                                )}
                                {col.type === ColumnType.DYNAMIC && col.items.length > 0 && (
                                    <BranchNavigation
                                        items={col.items}
                                        path={path}
                                        activeItemId={activeItemIds[col.id] ?? null}
                                        onItemSelect={(itemId) => handleItemSelect(col.id, itemId)}
                                    />
                                )}
                            </div>
                        </div>
                        {col.type === ColumnType.BRANCH ? (
                            <div className="flex-grow overflow-y-auto no-scrollbar p-4 space-y-2">
                                {col.items.map(item => (
                                    <div key={item.id} onClick={() => handleItemSelect(col.id, item.id)}
                                        className={`p-3 rounded-lg transition-colors cursor-pointer ${activeItemIds[col.id] === item.id ? 'bg-brand-accent ring-2 ring-gray-400' : 'bg-brand-primary hover:bg-brand-secondary'}`}
                                    >
                                        {item.title}
                                    </div>
                                ))}
                            </div>
                        ) : (col as any).type === 'AI' ? (
                            <AiAssistantColumn context={extractTextFromColumn(aiParentColumn!)} />
                        ) : (
                            <div className="flex-grow overflow-y-auto no-scrollbar">
                                <ReadOnlyDynamicColumn sections={col.sections} />
                            </div>
                        )}
                    </div>
                    { (col as any).type !== 'AI' &&
                        <div onMouseDown={(e) => startResizing(e, col.id)} className="w-2 h-full cursor-col-resize flex items-center justify-center group">
                          <div className="w-0.5 h-full bg-brand-accent group-hover:bg-blue-500 transition-colors"></div>
                        </div>
                    }
                </div>
            ))}
        </>
    );

    return isMobile ? renderMobileView() : renderDesktopView();
};