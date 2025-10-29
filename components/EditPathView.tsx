import React, { useState, useEffect, useCallback } from 'react';
import { usePaths } from '../hooks/usePaths';
import { LearningPath, PathColumn, PathItem, DynamicContentSection, ColumnType, SectionType } from '../types';
import { ArrowLeftIcon, UndoIcon, RedoIcon, TrashIcon } from './icons';
import { AutoSizingTextArea } from './common/AutoSizingTextArea';
import { EditableColumn } from './editor/EditableColumn';
import { AddColumnPanel } from './editor/AddColumnPanel';

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
                case SectionType.VIDEO: content = { url: '', dataUrl: null, width: 100 }; break;
                case SectionType.BULLETS: content = { ordered: false, items: ['First item'] }; break;
                case SectionType.QANDA: content = { question: 'Question?', answer: 'Answer.', isCollapsed: false }; break;
                case SectionType.LINK: content = { text: 'Link Text', url: 'https://' }; break;
                case SectionType.TABLE: content = { cells: [['', ''], ['', '']] }; break;
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
                if (col) col.width = Math.max(120, newWidth);
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
                            <TrashIcon className="w-5 h-5" />
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
            <main className="flex-grow flex flex-col min-h-0">
                <div className="flex-grow relative">
                    <div className="absolute inset-0 flex items-start overflow-x-auto no-scrollbar">
                        {isMobile ? renderMobileView() : renderDesktopView()}
                    </div>
                </div>
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