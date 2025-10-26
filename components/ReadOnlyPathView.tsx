import React, { useState, useCallback, useRef, useEffect } from 'react';
import { usePaths } from '../hooks/usePaths';
import { EditIcon, ResizeGripIcon, ChevronDownIcon, ArrowLeftIcon, ChevronRightIcon, PlayCircleIcon } from './icons';
import { LearningPath, PathColumn, ColumnType, DynamicContentSection, SectionType, PathItem } from '../types';

interface ReadOnlyPathViewProps {
    pathId: string;
    onEdit: (pathId: string) => void; 
    onBack: () => void;
    isMobile: boolean;
}

const ReadOnlyPathView: React.FC<ReadOnlyPathViewProps> = ({ pathId, onEdit, onBack, isMobile }) => {
  const { getPathById } = usePaths();
  const path = getPathById(pathId);

  if (!path) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-brand-primary text-center p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Path Not Found</h1>
        <p className="text-lg text-gray-600 mb-6">The path you are looking for does not exist.</p>
        <button onClick={onBack} className="flex items-center px-6 py-3 bg-brand-text text-brand-primary font-semibold rounded-lg shadow-sm hover:bg-gray-800 transition-colors">
          Go to Library
        </button>
      </div>
    );
  }

  return <PathViewer path={path} onEdit={onEdit} onBack={onBack} isMobile={isMobile} />;
};

const BranchNavigation: React.FC<{
    items: PathItem[];
    activeItemId: string | null;
    onItemSelect: (itemId: string) => void;
}> = ({ items, activeItemId, onItemSelect }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (items.length === 1) {
        const item = items[0];
        return (
            <button 
                onClick={() => onItemSelect(item.id)} 
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    activeItemId === item.id 
                        ? 'bg-brand-text text-brand-primary' 
                        : 'bg-brand-secondary hover:bg-brand-accent'
                }`}
            >
                <span className="truncate max-w-[120px]">{item.title}</span>
                <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
            </button>
        );
    }
    
    if (items.length > 1) {
        return (
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-brand-secondary hover:bg-brand-accent"
                >
                    <span>Next Steps</span>
                    <ChevronDownIcon className="w-4 h-4" />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-brand-primary rounded-md shadow-lg z-10 border border-brand-accent p-1">
                        {items.map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onItemSelect(item.id);
                                    setIsMenuOpen(false);
                                }}
                                className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-brand-secondary ${
                                    activeItemId === item.id ? 'bg-brand-accent' : ''
                                }`}
                            >
                                <span>{item.title}</span>
                                {activeItemId === item.id && <ChevronRightIcon className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
};

const PathViewer: React.FC<{ path: LearningPath; onEdit: (pathId: string) => void; onBack: () => void; isMobile: boolean }> = ({ path, onEdit, onBack, isMobile }) => {
    const [activeItemIds, setActiveItemIds] = useState<Record<string, string | null>>({});
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

    const visibleColumns: PathColumn[] = [];
    const rootColumn = path.columns.find(c => c.parentItemId === null);
    if (rootColumn) {
        visibleColumns.push(rootColumn);
        let activeItemId = activeItemIds[rootColumn.id];
        while (activeItemId) {
            const childCol = path.columns.find(c => c.parentItemId === activeItemId);
            if (childCol) {
                visibleColumns.push(childCol);
                activeItemId = activeItemIds[childCol.id];
            } else {
                activeItemId = null;
            }
        }
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
                <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-brand-accent h-16 bg-brand-primary">
                    <div className="flex items-center min-w-0">
                        {parentColumn ? (
                            <button onClick={handleMobileBack} className="flex-shrink-0 p-2 text-gray-700 hover:bg-brand-secondary rounded-full">
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                        ) : null}
                        <h2 className="font-bold text-lg px-2 truncate">{currentColumn.title}</h2>
                    </div>
                    
                    {currentColumn.type === ColumnType.DYNAMIC && currentColumn.items.length > 0 && (
                        <div className="flex-shrink-0">
                             <BranchNavigation
                                items={currentColumn.items}
                                activeItemId={activeItemIds[currentColumn.id] ?? null}
                                onItemSelect={(itemId) => {
                                    const newActiveIds = { ...activeItemIds, [currentColumn.id]: itemId };
                                    setActiveItemIds(newActiveIds);
                                }}
                            />
                        </div>
                    )}
                </div>
                
                <div className="w-full flex flex-col flex-grow overflow-y-auto">
                    {currentColumn.type === ColumnType.BRANCH ? (
                        <div className="flex-grow overflow-y-auto no-scrollbar bg-brand-secondary border-t border-brand-accent">
                            {currentColumn.items.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => {
                                        const newActiveIds = { ...activeItemIds, [currentColumn.id]: item.id };
                                        setActiveItemIds(newActiveIds);
                                    }}
                                    className={`w-full text-left border-b border-brand-accent transition-colors ${activeItemIds[currentColumn.id] === item.id ? 'bg-brand-accent' : 'bg-brand-primary hover:bg-brand-secondary'}`}
                                >
                                    <div className={`px-4 py-3 ${activeItemIds[currentColumn.id] === item.id ? 'font-semibold' : ''}`}>
                                        {item.title}
                                    </div>
                                </button>
                            ))}
                        </div>
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
            {visibleColumns.map((col, index) => (
                <div key={col.id} className="flex-shrink-0 h-full flex" style={{ width: columnWidths[col.id] || col.width }}>
                    <div className="w-full flex flex-col bg-brand-secondary border-r border-brand-accent min-w-0">
                        <div className="flex-shrink-0 flex items-center justify-between p-4 h-20 border-b border-brand-accent">
                            <h2 className="font-bold text-lg truncate">{col.title}</h2>
                             {col.type === ColumnType.DYNAMIC && col.items.length > 0 && (
                                <BranchNavigation
                                    items={col.items}
                                    activeItemId={activeItemIds[col.id] ?? null}
                                    onItemSelect={(itemId) => {
                                        const newActiveIds = { ...activeItemIds, [col.id]: itemId };
                                        visibleColumns.slice(index + 1).forEach(c => delete newActiveIds[c.id]);
                                        setActiveItemIds(newActiveIds);
                                    }}
                                />
                            )}
                        </div>
                        {col.type === ColumnType.BRANCH ? (
                            <div className="flex-grow overflow-y-auto no-scrollbar p-4 space-y-2">
                                {col.items.map(item => (
                                    <div key={item.id} onClick={() => {
                                        const newActiveIds = { ...activeItemIds, [col.id]: item.id };
                                        visibleColumns.slice(index + 1).forEach(c => delete newActiveIds[c.id]);
                                        setActiveItemIds(newActiveIds);
                                    }}
                                        className={`p-3 rounded-lg transition-colors cursor-pointer ${activeItemIds[col.id] === item.id ? 'bg-brand-accent ring-2 ring-gray-400' : 'bg-brand-primary hover:bg-brand-secondary'}`}
                                    >
                                        {item.title}
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="flex-grow overflow-y-auto no-scrollbar">
                                <ReadOnlyDynamicColumn sections={col.sections} />
                            </div>
                        )}
                    </div>
                    <div onMouseDown={(e) => startResizing(e, col.id)} className="w-2 h-full cursor-col-resize flex items-center justify-center group">
                      <div className="w-0.5 h-full bg-brand-accent group-hover:bg-blue-500 transition-colors"></div>
                    </div>
                </div>
            ))}
        </>
    );

    return (
        <div className="h-full w-full flex flex-col bg-brand-primary text-brand-text">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-brand-accent h-16">
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    <button onClick={onBack} className="p-2 hover:bg-brand-secondary rounded-full">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold truncate">{path.title}</h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                    <button onClick={() => onEdit(path.id)} className="flex items-center justify-center px-3 py-2 bg-brand-text text-brand-primary font-semibold rounded-lg shadow-sm hover:bg-gray-800 transition-colors text-sm">
                        <EditIcon className="w-4 h-4 mr-2" /> <span>Edit</span>
                    </button>
                </div>
            </header>
            <main className="flex-grow flex items-start overflow-auto no-scrollbar">
                {isMobile ? renderMobileView() : renderDesktopView()}
            </main>
        </div>
    );
};

const ReadOnlyDynamicColumn: React.FC<{ sections: DynamicContentSection[] }> = ({ sections }) => {
    const regularSections = sections.filter(s => s.type !== SectionType.FLOATING);
    const floatingSections = sections.filter(s => s.type === SectionType.FLOATING);

    return (
        <div className="relative bg-brand-secondary">
             <div className="space-y-6 py-6">
                {regularSections.map(section => (
                    <ReadOnlySection key={section.id} section={section} />
                ))}
            </div>
            {floatingSections.map(section => (
                <div key={section.id} style={{ position: 'absolute', transform: `translate(${section.content.x}px, ${section.content.y}px)`, width: section.content.width, height: section.content.height }}
                    className="bg-gray-100/80 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg p-2 flex flex-col"
                >
                     <p className="text-sm whitespace-pre-wrap">{section.content.text}</p>
                </div>
            ))}
        </div>
    );
};

const VideoThumbnailPlayer: React.FC<{ url: string | undefined }> = ({ url }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [videoTitle, setVideoTitle] = useState<string>('Watch video');
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;
        const currentRef = containerRef.current;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Disconnect the observer to fetch only once
                    observer.disconnect();

                    const fetchThumbnail = async () => {
                        if (!url || typeof url !== 'string') {
                            if (isMounted) {
                                setThumbnailUrl(null);
                                setIsLoading(false);
                            }
                            return;
                        }

                        // YouTube
                        let match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                        if (match && match[1]) {
                            if (isMounted) {
                                setThumbnailUrl(`https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`);
                                setVideoTitle('Watch on YouTube');
                                setIsLoading(false);
                            }
                            return;
                        }

                        // Vimeo
                        match = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/);
                        if (match && match[1]) {
                            try {
                                const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
                                if (!response.ok) throw new Error('Vimeo API error');
                                const data = await response.json();
                                if (isMounted) {
                                    setThumbnailUrl(data.thumbnail_url);
                                    setVideoTitle(data.title || 'Watch on Vimeo');
                                }
                            } catch (error) {
                                console.error("Failed to fetch Vimeo thumbnail", error);
                                if (isMounted) setThumbnailUrl(null);
                            } finally {
                                if (isMounted) setIsLoading(false);
                            }
                            return;
                        }
                        
                        if (isMounted) {
                            setThumbnailUrl(null);
                            setIsLoading(false);
                        }
                    };

                    fetchThumbnail();
                }
            },
            { rootMargin: '200px 0px' }
        );

        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            isMounted = false;
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [url]);

    return (
        <div ref={containerRef}>
            {isLoading ? (
                <div className="block w-full aspect-video bg-gray-200 animate-pulse rounded-md" />
            ) : !thumbnailUrl ? (
                <div className="px-4 py-2 my-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800">
                    <p className="font-bold">Cannot display video</p>
                    {url ? (
                        <p className="text-sm">Please provide a valid YouTube or Vimeo URL. Current: <code className="break-all">{url}</code></p>
                    ) : (
                        <p className="text-sm">No video URL has been provided. Please edit the path to add one.</p>
                    )}
                </div>
            ) : (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full aspect-video bg-black group relative">
                    <img src={thumbnailUrl} alt={videoTitle} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity opacity-100 group-hover:opacity-100">
                        <PlayCircleIcon className="w-16 h-16 text-white/80" />
                    </div>
                </a>
            )}
        </div>
    );
};

const ReadOnlySection: React.FC<{ section: DynamicContentSection }> = ({ section }) => {
    switch (section.type) {
        case SectionType.HEADING: return <h2 className="text-2xl font-bold px-4">{section.content?.text}</h2>;
        case SectionType.SUB_HEADING: return <h3 className="text-xl font-semibold text-gray-700 px-4">{section.content?.text}</h3>;
        case SectionType.PARAGRAPH: return <p className="whitespace-pre-wrap px-4">{section.content?.text}</p>;
        case SectionType.IMAGE: return (
            <div style={{ width: `${section.content.width || 100}%`, margin: '0 auto' }}>
                <img src={section.content.src} alt="content" className="w-full h-auto" />
            </div>
        );
        case SectionType.VIDEO: {
            return (
                <div style={{ width: `${section.content.width || 100}%`, margin: '0 auto' }}>
                    <VideoThumbnailPlayer url={section.content?.url} />
                </div>
            );
        }
        case SectionType.BULLETS:
            const ListTag = section.content.ordered ? 'ol' : 'ul';
            const listClass = section.content.ordered ? 'list-decimal' : 'list-disc';
            return <ListTag className={`${listClass} list-outside pl-8 pr-4`}>
                {section.content.items.map((item: string, index: number) => <li key={index} className="mb-1">{item}</li>)}
            </ListTag>;
        case SectionType.QANDA: {
            const [isCollapsed, setIsCollapsed] = useState(true);
            return (
                <div 
                    className="bg-brand-primary px-4 cursor-pointer"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-start justify-between gap-4 py-3">
                        <div className="flex items-start gap-2">
                            <p className="font-bold text-gray-700">Q:</p>
                            <p className="font-bold flex-1">{section.content.question}</p>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 mt-1 transition-transform flex-shrink-0 text-gray-500 ${!isCollapsed ? 'rotate-180' : ''}`} />
                    </div>
                    {!isCollapsed && (
                        <div className="flex items-start gap-2 pb-3 pl-[26px] border-t border-brand-accent pt-3">
                            <p className="font-bold text-gray-700">A:</p>
                            <p className="flex-1 whitespace-pre-wrap text-gray-800">{section.content.answer}</p>
                        </div>
                    )}
                </div>
            );
        }
        case SectionType.LINK: return <a href={section.content.url} target="_blank" rel="noopener noreferrer" className="block py-3 px-4 border-y border-brand-accent text-blue-600 hover:bg-blue-50 bg-brand-primary">
                <span className="font-medium">{section.content.text}</span>
                <span className="text-xs text-gray-500 block truncate">{section.content.url}</span>
            </a>;
        default: return null;
    }
};


export default ReadOnlyPathView;