import React from 'react';
import { usePaths } from '../hooks/usePaths';
import { EditIcon, ArrowLeftIcon } from './icons';
import { PathViewer } from './viewer/PathViewer';

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
            <PathViewer path={path} isMobile={isMobile} />
        </main>
    </div>
  );
};

export default ReadOnlyPathView;