import React from 'react';
import { usePaths } from '../hooks/usePaths';
import { StarIcon, EditIcon, BookIcon } from './icons';
import { PathViewer } from './viewer/PathViewer';

interface MajorPathViewProps {
    onEdit: (pathId: string) => void; 
    onChangeMajor: () => void;
    isMobile: boolean;
}

const MajorPathView: React.FC<MajorPathViewProps> = ({ onEdit, onChangeMajor, isMobile }) => {
  const { majorPath } = usePaths();

  if (!majorPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-brand-primary text-center p-4">
        <StarIcon className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">No Major Path Set</h1>
        <p className="text-lg text-gray-600 mb-6">Designate a primary learning path from your library to see it here.</p>
        <button onClick={onChangeMajor} className="flex items-center px-6 py-3 bg-brand-text text-brand-primary font-semibold rounded-lg shadow-sm hover:bg-gray-800 transition-colors">
          <BookIcon className="w-5 h-5 mr-2" /> Go to Library
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-brand-primary text-brand-text">
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-brand-accent h-16">
            <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold">{majorPath.title}</h1>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                    <StarIcon className="w-5 h-5 mr-2 text-gray-500 flex-shrink-0" />
                    <span>Your Major Path</span>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                <button onClick={onChangeMajor} className="px-3 py-2 border border-gray-300 font-semibold rounded-lg hover:bg-brand-secondary transition-colors text-sm">Change</button>
                <button onClick={() => onEdit(majorPath.id)} className="flex items-center justify-center px-3 py-2 bg-brand-text text-brand-primary font-semibold rounded-lg shadow-sm hover:bg-gray-800 transition-colors text-sm">
                    <EditIcon className="w-4 h-4 mr-2" /> <span>Edit</span>
                </button>
            </div>
        </header>
        <main className="flex-grow flex items-start overflow-auto no-scrollbar">
            <PathViewer path={majorPath} isMobile={isMobile} />
        </main>
    </div>
  );
};

export default MajorPathView;