import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import CreatePathView from './components/CreatePathView';
import EditPathView from './components/EditPathView';
import MajorPathView from './components/MajorPathView';
import LearningPathsView from './components/LearningPathsView';
import ReadOnlyPathView from './components/ReadOnlyPathView';
import { View } from './types';
import { MenuIcon, LogoFull } from './components/icons';
import { useIsMobile } from './hooks/useIsMobile';


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('library');
  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  const [viewingPathId, setViewingPathId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .no-scrollbar::-webkit-scrollbar {
          display: none;
      }
      .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + mouseMoveEvent.clientX - startX;
      const clampedWidth = Math.max(70, Math.min(newWidth, 220));
      setSidebarWidth(clampedWidth);
    };

    const stopDrag = () => {
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
    };

    document.documentElement.addEventListener('mousemove', doDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
  }, [sidebarWidth]);
  

  const handlePathCreated = (pathId: string) => {
    setEditingPathId(pathId);
    setCurrentView('edit');
  };
  
  const handleEditPath = (pathId: string) => {
    setViewingPathId(null);
    setEditingPathId(pathId);
    setCurrentView('edit');
  };

  const handleViewPath = (pathId: string) => {
    setEditingPathId(null);
    setViewingPathId(pathId);
    setCurrentView('view_path');
  };
  
  const handleBackToLibrary = () => {
    setEditingPathId(null);
    setViewingPathId(null);
    setCurrentView('library');
  };
  
  const handleChangeMajor = () => {
      setCurrentView('library');
  };

  const renderView = () => {
    switch (currentView) {
      case 'create_initial':
        return <CreatePathView onPathCreated={handlePathCreated} />;
      case 'edit':
        if (editingPathId) {
          return <EditPathView pathId={editingPathId} onBack={handleBackToLibrary} isMobile={isMobile} />;
        }
        setCurrentView('library'); // Fallback
        return null;
      case 'view_path':
        if (viewingPathId) {
            return <ReadOnlyPathView 
                pathId={viewingPathId}
                onBack={handleBackToLibrary}
                onEdit={handleEditPath}
                isMobile={isMobile}
            />;
        }
        setCurrentView('library'); // Fallback
        return null;
      case 'major':
        return <MajorPathView onEdit={handleEditPath} onChangeMajor={handleChangeMajor} isMobile={isMobile} />;
      case 'library':
      default:
        return <LearningPathsView onEditPath={handleEditPath} onNewPath={() => setCurrentView('create_initial')} onViewPath={handleViewPath} />;
    }
  };

  return (
    <div className="flex h-screen bg-brand-primary relative">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        width={sidebarWidth} 
        onResizeStart={startResizing}
        isMobile={isMobile}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div 
        className="flex-grow transition-all duration-300 h-screen flex flex-col" 
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        {isMobile && (
          <header className="flex-shrink-0 flex items-center justify-between p-4 h-20 bg-brand-primary border-b border-brand-accent">
            <LogoFull />
            <button 
              onClick={() => setIsMobileSidebarOpen(true)} 
              aria-label="Open navigation menu"
              className="p-2"
            >
              <MenuIcon className="w-6 h-6 text-brand-text" />
            </button>
          </header>
        )}
        <main className="flex-grow overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;