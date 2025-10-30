import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ArrowLeftIcon, SparklesIcon, FilmIcon, XIcon } from '../icons';
import { LearningPath, PathColumn, ColumnType, SectionType, ColumnChatHistory, ChatSession } from '../../types';
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

export const PathViewer: React.FC<{ path: LearningPath; isMobile: boolean; }> = ({ path, isMobile }) => {
    const [activeItemIds, setActiveItemIds] = useState<Record<string, string | null>>({});
    const [aiParentColumn, setAiParentColumn] = useState<PathColumn | null>(null);
    const [chatHistories, setChatHistories] = useState<Record<string, ColumnChatHistory>>({});
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
      Object.fromEntries(path.columns.map(c => [c.id, c.width]))
    );
    
    // State for video generation
    const [modalState, setModalState] = useState<'closed' | 'apiKeySelection' | 'generating' | 'success' | 'error'>('closed');
    const [videoGenerationColumn, setVideoGenerationColumn] = useState<PathColumn | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationProgressMessage, setGenerationProgressMessage] = useState('Initializing...');
    const [apiKeySelected, setApiKeySelected] = useState(false);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
            }
        };
        checkKey();
    }, []);
    
    const runVideoGeneration = async (column: PathColumn) => {
        setGenerationProgressMessage('Extracting content...');
        const context = extractTextFromColumn(column);
        if (!context.trim()) {
            setGenerationError("This column has no text content to generate a video from.");
            setModalState('error');
            return;
        }

        const prompt = `Create an educational, animated sketch-style explainer video (also known as whiteboard animation) about the following topic: \n\n${context}. Use simple line drawings, icons, and animated text to explain the key concepts clearly. The tone should be informative and engaging.`;

        try {
            // Re-create instance to ensure latest key is used
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            setGenerationProgressMessage('Generating script...');
            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt,
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
            });

            setGenerationProgressMessage('Animating scenes... This may take a few minutes.');
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }
            
            setGenerationProgressMessage('Finalizing video...');
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                const videoBlob = await response.blob();
                const videoUrl = URL.createObjectURL(videoBlob);
                setGeneratedVideoUrl(videoUrl);
                setModalState('success');
            } else {
                throw new Error('Video generation finished, but no download link was provided.');
            }
        } catch (err: any) {
            console.error("Video generation failed:", err);
            let errorMessage = err.message || "An unknown error occurred during video generation.";
            if (errorMessage.includes("Requested entity was not found")) {
                errorMessage = "Your API key is invalid or has been revoked. Please select a valid key.";
                setApiKeySelected(false); 
            }
            setGenerationError(errorMessage);
            setModalState('error');
        }
    };
    
    useEffect(() => {
        if (modalState === 'generating' && videoGenerationColumn) {
            runVideoGeneration(videoGenerationColumn);
        }
    }, [modalState, videoGenerationColumn]);

    const handleGenerateVideoClick = async (column: PathColumn) => {
        setVideoGenerationColumn(column);
        if (apiKeySelected) {
            setModalState('generating');
        } else {
            const hasKey = window.aistudio && await window.aistudio.hasSelectedApiKey();
            if (hasKey) {
                setApiKeySelected(true);
                setModalState('generating');
            } else {
                setModalState('apiKeySelection');
            }
        }
    };
    
    const handleSelectApiKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true); // Assume success to avoid race condition
            setModalState('generating');
        } else {
            setGenerationError("API Key selection is not available in this environment.");
            setModalState('error');
        }
    };
    
    const closeModal = () => {
        setModalState('closed');
        setVideoGenerationColumn(null);
        setGenerationError(null);
        if (generatedVideoUrl) {
            URL.revokeObjectURL(generatedVideoUrl);
            setGeneratedVideoUrl(null);
        }
    };

    const startResizing = useCallback((e: React.MouseEvent, columnId: string) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = columnWidths[columnId] || 320;
        
        const doDrag = (moveEvent: MouseEvent) => {
            const newWidth = startWidth + moveEvent.clientX - startX;
            setColumnWidths(prev => ({ ...prev, [columnId]: Math.max(120, newWidth) }));
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
        setChatHistories(prev => {
            if (prev[column.id]) {
                return prev; // History already exists
            }
            const newSessionId = crypto.randomUUID();
            const newHistory: ColumnChatHistory = {
                sessions: [{ id: newSessionId, messages: [], createdAt: new Date().toISOString() }],
                activeSessionId: newSessionId,
            };
            return { ...prev, [column.id]: newHistory };
        });
        setAiParentColumn(column);
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
                        {parentColumn && (currentColumn as any).type !== 'AI' ? (
                            <button onClick={handleMobileBack} className="flex-shrink-0 p-2 text-gray-700 hover:bg-brand-secondary rounded-full">
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                        ) : null}
                        <h2 className="font-bold text-lg px-2 truncate">{currentColumn.title}</h2>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center gap-2">
                        {currentColumn.type === ColumnType.DYNAMIC && (
                            <>
                                <button onClick={() => handleGenerateVideoClick(currentColumn)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200">
                                    <FilmIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleAiButtonClick(currentColumn)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200">
                                    <SparklesIcon className="w-4 h-4" />
                                </button>
                            </>
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
                        <AiAssistantColumn 
                            context={extractTextFromColumn(aiParentColumn!)}
                            chatHistory={chatHistories[aiParentColumn!.id]}
                            onChatHistoryChange={(newChatHistory) => setChatHistories(prev => ({ ...prev, [aiParentColumn!.id]: newChatHistory }))}
                            onClose={() => setAiParentColumn(null)}
                        />
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
                                    <>
                                        <button onClick={() => handleGenerateVideoClick(col)} title="Generate sketch video" className="flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200">
                                            <FilmIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleAiButtonClick(col)} title="AI Assistant" className="flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200">
                                            <SparklesIcon className="w-4 h-4" />
                                        </button>
                                    </>
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
                            <AiAssistantColumn 
                                context={extractTextFromColumn(aiParentColumn!)}
                                chatHistory={chatHistories[aiParentColumn!.id]}
                                onChatHistoryChange={(newChatHistory) => setChatHistories(prev => ({ ...prev, [aiParentColumn!.id]: newChatHistory }))}
                                onClose={() => setAiParentColumn(null)}
                            />
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

    const renderModal = () => {
        if (modalState === 'closed') return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
                <div className="bg-brand-primary rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <header className="flex items-center justify-between p-4 border-b border-brand-accent">
                        <h2 className="text-lg font-bold">
                            {modalState === 'apiKeySelection' && 'AI Video Generation'}
                            {modalState === 'generating' && `Generating Video...`}
                            {modalState === 'success' && 'Generated Video'}
                            {modalState === 'error' && 'Error'}
                        </h2>
                        <button onClick={closeModal} className="p-1 rounded-full hover:bg-brand-secondary"><XIcon className="w-5 h-5"/></button>
                    </header>
                    <main className="p-6 overflow-y-auto">
                        {modalState === 'apiKeySelection' && (
                           <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 text-blue-500 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FilmIcon className="w-8 h-8"/>
                                </div>
                                <h3 className="text-xl font-bold text-brand-text mb-2">Generate Explainer Video</h3>
                                <p className="text-gray-600 mb-4">
                                    This powerful feature uses Google's Veo model to create a unique video based on your content.
                                </p>
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left text-sm">
                                    <p className="font-semibold text-yellow-800">API Key & Billing Required</p>
                                    <p className="text-yellow-700 mt-1">
                                        Accessing advanced models like Veo requires an API key with an active billing account. This ensures fair usage and supports the underlying technology. For more details, please review the 
                                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-yellow-900"> official billing documentation</a>.
                                    </p>
                                </div>
                                <div className="flex justify-center gap-4 mt-8">
                                    <button onClick={closeModal} className="px-5 py-2 bg-brand-secondary border border-brand-accent font-semibold rounded-lg shadow-sm hover:bg-brand-accent">Maybe Later</button>
                                    <button onClick={handleSelectApiKey} className="px-5 py-2 bg-brand-text text-brand-primary font-semibold rounded-lg shadow-sm hover:bg-gray-800">Select API Key</button>
                                </div>
                            </div>
                        )}
                        {modalState === 'generating' && (
                            <div className="text-center py-10">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-lg font-medium text-gray-800">{generationProgressMessage}</p>
                            </div>
                        )}
                        {modalState === 'success' && generatedVideoUrl && (
                            <video src={generatedVideoUrl} controls autoPlay className="w-full rounded-md" />
                        )}
                        {modalState === 'error' && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800">
                                <p className="font-bold">Generation Failed</p>
                                <p className="text-sm">{generationError}</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        );
    }

    return (
        <>
            {isMobile ? renderMobileView() : renderDesktopView()}
            {renderModal()}
        </>
    );
};