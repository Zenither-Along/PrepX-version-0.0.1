import React from 'react';
import { View } from '../types';
import { PlusIcon, StarIcon, BookIcon, XIcon, LogoFull, LogoIcon } from './icons';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, width, onResizeStart, isMobile, isOpen, onClose }) => {
  const isCollapsed = !isMobile && width < 120;

  const handleSetView = (view: View) => {
    setView(view);
    if (isMobile) {
      onClose();
    }
  };

  const NavItem: React.FC<{ view: View; icon: React.ReactElement<{ className?: string }>; label: string }> = ({ view, icon, label }) => (
    <button
      onClick={() => handleSetView(view)}
      className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
        currentView === view ? 'bg-brand-accent text-brand-text' : 'text-gray-600 hover:bg-brand-accent hover:text-brand-text'
      }`}
    >
      {React.cloneElement(icon, { className: 'w-6 h-6 flex-shrink-0' })}
      {!isCollapsed && <span className="ml-4 font-medium">{label}</span>}
    </button>
  );

  return (
    <>
      {isMobile && isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/40 z-20 transition-opacity" />}
      <div
        className={`fixed top-0 left-0 h-full bg-brand-secondary flex flex-col z-30 border-r border-brand-accent transition-transform duration-300 ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : ''}`}
        style={{ width: isMobile ? 250 : width }}
      >
        <div className="flex-shrink-0 flex items-center justify-between p-4 h-20 border-b border-brand-accent">
          {isCollapsed ? <LogoIcon /> : <LogoFull />}
          {isMobile && (
            <button onClick={onClose} className="p-2 -mr-2">
                <XIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        <nav className="flex-grow p-4 space-y-2">
          <NavItem
            view="library"
            icon={<BookIcon />}
            label="Library"
          />
          <NavItem
            view="major"
            icon={<StarIcon />}
            label="Major Path"
          />
          <NavItem
            view="create_initial"
            icon={<PlusIcon />}
            label="New Path"
          />
        </nav>
        
        <div className="p-4 border-t border-brand-accent">
          <div className="flex items-center justify-center h-10 w-10">
              <LogoIcon />
          </div>
        </div>

        {!isMobile && (
          <div 
            className="absolute top-0 right-0 h-full w-2 cursor-col-resize group"
            onMouseDown={onResizeStart}
          >
            <div className="w-0.5 h-full bg-transparent group-hover:bg-blue-500 transition-colors duration-200 mx-auto"></div>
          </div>
        )}
      </div>
    </>
  );
};