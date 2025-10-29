import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import CreatePathView from './components/CreatePathView';
import EditPathView from './components/EditPathView';
import MajorPathView from './components/MajorPathView';
import LearningPathsView from './components/LearningPathsView';
import ReadOnlyPathView from './components/ReadOnlyPathView';
import AuthView from './components/AuthView';
import ProfileView from './components/ProfileView';
import { View } from './types';
import { MenuIcon, LogoFull } from './components/icons';
import { useIsMobile } from './hooks/useIsMobile';
import { useAuth } from './hooks/useAuth';

const MIN_SIDEBAR_WIDTH = 70;
const DEFAULT_SIDEBAR_WIDTH = 220;

const App: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<View>('library');
  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  const [viewingPathId, setViewingPathId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Reset view when user logs out
    if (!currentUser) {
      setCurrentView('library');
      setEditingPathId(null);
      setViewingPathId(null);
    }
  }, [currentUser]);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + mouseMoveEvent.clientX - startX;
      const clampedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(newWidth, 220));
      setSidebarWidth(clampedWidth);
    };

    const stopDrag = () => {
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
    };

    document.documentElement.addEventListener('mousemove', doDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
  }, [sidebarWidth]);
  
  const handleToggleSidebar = () => {
    setSidebarWidth(prev => prev > MIN_SIDEBAR_WIDTH ? MIN_SIDEBAR_WIDTH : DEFAULT_SIDEBAR_WIDTH);
  };

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

  if (!currentUser) {
    return <AuthView />;
  }

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
      case 'profile':
        return <ProfileView />;
      case 'library':
      default:
        return <LearningPathsView onEditPath={handleEditPath} onNewPath={() => setCurrentView('create_initial')} onViewPath={handleViewPath} />;
    }
  };
  
  const showMobileHeader = isMobile && currentView !== 'edit' && currentView !== 'view_path';

  return (
    <div className="flex h-screen bg-brand-primary">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        width={sidebarWidth} 
        onResizeStart={startResizing}
        onToggleCollapse={handleToggleSidebar}
        isMobile={isMobile}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div 
        className="flex-1 flex flex-col transition-all duration-300" 
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        {showMobileHeader && (
          <header className="flex-shrink-0 flex items-center justify-between p-4 h-20 bg-brand-primary border-b border-brand-accent z-10">
             <div className="flex items-center justify-between w-full">
                <LogoFull />
                <button 
                  onClick={() => setIsMobileSidebarOpen(true)} 
                  aria-label="Open navigation menu"
                  className="p-2"
                >
                  <MenuIcon className="w-6 h-6 text-brand-text" />
                </button>
            </div>
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