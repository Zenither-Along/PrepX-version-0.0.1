import React from 'react';
import { View } from '../types';
import { useAuth } from '../hooks/useAuth';
import { BookIcon, StarIcon, LogOutIcon, LogoFull, LogoIcon, UserCircleIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from './icons';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  onToggleCollapse: () => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  width,
  onResizeStart,
  onToggleCollapse,
  isMobile,
  isOpen,
  onClose,
}) => {
  const { currentUser, logout } = useAuth();
  const isCompact = width < 120;
  const MIN_SIDEBAR_WIDTH = 70;

  const NavItem: React.FC<{
    view: View;
    icon: React.ReactNode;
    label: string;
    activeViews?: View[];
  }> = ({ view, icon, label, activeViews }) => {
    const isActive = currentView === view || (activeViews && activeViews.includes(currentView));
    return (
      <button
        onClick={() => {
          setView(view);
          if (isMobile) onClose();
        }}
        className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
          isActive
            ? 'bg-brand-secondary text-brand-text'
            : 'text-gray-600 hover:bg-brand-secondary hover:text-brand-text'
        } ${isCompact ? 'justify-center' : ''}`}
      >
        <div className="flex-shrink-0">{icon}</div>
        {!isCompact && <span className="ml-3 font-medium">{label}</span>}
      </button>
    );
  };
  
  const sidebarContent = (
    <div className="flex flex-col h-full bg-brand-primary border-r border-brand-accent">
      <div className={`flex items-center h-20 border-b border-brand-accent ${isCompact ? 'justify-center' : 'px-4'}`}>
        {isCompact ? <LogoIcon /> : <LogoFull />}
      </div>
      <nav className="flex-grow p-3 space-y-2">
        <NavItem
          view="major"
          icon={<StarIcon className="w-6 h-6" />}
          label="Major Path"
        />
        <NavItem
          view="library"
          icon={<BookIcon className="w-6 h-6" />}
          label="Library"
          activeViews={['library', 'create_initial', 'edit', 'view_path']}
        />
      </nav>
      <div className="flex-shrink-0 p-3 border-t border-brand-accent">
        <div className="w-full flex items-center p-3 rounded-lg text-left text-gray-600">
           <button onClick={() => { setView('profile'); if (isMobile) onClose(); }} className={`flex items-center w-full ${isCompact ? 'justify-center' : ''}`}>
                <UserCircleIcon className="w-6 h-6 flex-shrink-0" />
                {!isCompact && (
                    <div className="ml-3 text-left">
                        <p className="font-medium text-brand-text truncate">{currentUser?.username}</p>
                    </div>
                )}
           </button>
           {!isCompact && (
             <button onClick={logout} className="p-2 ml-auto rounded-md hover:bg-brand-secondary flex-shrink-0">
                <LogOutIcon className="w-5 h-5" />
             </button>
           )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div 
          className={`fixed inset-0 bg-black/30 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
        ></div>
        <aside 
          className={`fixed top-0 left-0 h-full bg-brand-primary z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ width: 250 }}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside
      className="fixed top-0 left-0 h-full flex-shrink-0 z-20"
      style={{ width }}
    >
      <div className="relative w-full h-full">
        {sidebarContent}
        <div
          onMouseDown={onResizeStart}
          className="absolute top-0 right-0 w-2 h-full cursor-col-resize group"
        >
           <div className="w-px h-full bg-brand-accent group-hover:bg-blue-500 transition-colors mx-auto"></div>
        </div>
      </div>
        {!isMobile && (
            <button
                onClick={onToggleCollapse}
                className="absolute top-10 right-0 transform translate-x-1/2 -translate-y-1/2 z-30 w-7 h-7 bg-brand-primary border-2 border-brand-accent rounded-full flex items-center justify-center shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 transition-opacity"
                aria-label={width > MIN_SIDEBAR_WIDTH ? 'Collapse sidebar' : 'Expand sidebar'}
            >
                {width > MIN_SIDEBAR_WIDTH ? (
                    <ChevronDoubleLeftIcon className="w-4 h-4 text-gray-600" />
                ) : (
                    <ChevronDoubleRightIcon className="w-4 h-4 text-gray-600" />
                )}
            </button>
        )}
    </aside>
  );
};