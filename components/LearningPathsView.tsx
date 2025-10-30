import React, { useState, useMemo } from 'react';
import { usePaths } from '../hooks/usePaths';
import { LearningPath } from '../types';
import { EditIcon, TrashIcon, StarIcon, PlusIcon, SearchIcon, DotsVerticalIcon } from './icons';

interface LearningPathsViewProps {
  onEditPath: (pathId: string) => void;
  onNewPath: () => void;
  onViewPath: (pathId: string) => void;
}

const LearningPathsView: React.FC<LearningPathsViewProps> = ({ onEditPath, onNewPath, onViewPath }) => {
  const { paths, deletePath, setMajorPath, removeMajorPath } = usePaths();
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pathToDelete, setPathToDelete] = useState<LearningPath | null>(null);

  const filteredPaths = useMemo(() =>
    paths.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
  , [paths, searchTerm]);

  const handleDeleteConfirm = () => {
    if (pathToDelete) {
      deletePath(pathToDelete.id);
      setPathToDelete(null);
    }
  };

  const PathCard: React.FC<{ path: LearningPath }> = ({ path }) => {
    const isMenuOpen = openMenuId === path.id;

    return (
      <div className={`bg-brand-primary rounded-lg shadow-md p-6 flex flex-col justify-between transition-shadow hover:shadow-lg border ${path.isMajor ? 'border-brand-text' : 'border-brand-accent'}`}>
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 flex-1 mr-2 min-w-0">
              {path.isMajor && <StarIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
              <h3 onClick={() => onViewPath(path.id)} className="text-xl font-bold text-brand-text cursor-pointer hover:underline">{path.title}</h3>
            </div>
            <div className="relative flex-shrink-0">
              <button onClick={() => setOpenMenuId(isMenuOpen ? null : path.id)} className="p-1 rounded-full hover:bg-brand-secondary">
                <DotsVerticalIcon className="w-5 h-5 text-gray-500" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-brand-primary rounded-md shadow-lg z-10 border border-brand-accent">
                  <button onClick={() => { onEditPath(path.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-secondary flex items-center">
                    <EditIcon className="w-4 h-4 mr-2" /> Edit
                  </button>
                  {path.isMajor ? (
                    <button onClick={() => { removeMajorPath(); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-secondary flex items-center">
                      <StarIcon className="w-4 h-4 mr-2" /> Remove from Major
                    </button>
                  ) : (
                    <button onClick={() => { setMajorPath(path.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-secondary flex items-center">
                      <StarIcon className="w-4 h-4 mr-2" /> Set as Major
                    </button>
                  )}
                  <div className="border-t border-brand-accent my-1"></div>
                  <button onClick={() => { setPathToDelete(path); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-secondary flex items-center">
                    <TrashIcon className="w-4 h-4 mr-2" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
          <span>{new Date(path.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-brand-primary h-full flex flex-col">
      <header className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center gap-3 px-4 sm:px-8 py-3 border-b border-brand-accent">
        <h1 className="text-2xl font-bold text-brand-text">My Learning Paths</h1>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search paths..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:outline-none bg-brand-primary text-brand-text w-full"
            />
          </div>
          <button onClick={onNewPath} className="flex items-center justify-center px-4 py-2 bg-brand-text text-brand-primary font-semibold rounded-lg shadow-sm hover:bg-gray-800 transition-colors w-full sm:w-auto">
            <PlusIcon className="w-5 h-5 mr-2" /> New Path
          </button>
        </div>
      </header>
      
      <main className="flex-grow overflow-y-auto p-4 sm:p-8">
        {filteredPaths.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPaths.map(path => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-brand-primary rounded-lg">
            <h2 className="text-xl text-gray-600">No learning paths found.</h2>
            <p className="text-gray-500 mt-2 mb-6">Why not create one?</p>
            <button onClick={onNewPath} className="flex items-center justify-center mx-auto px-4 py-2 bg-brand-text text-brand-primary font-semibold rounded-lg shadow-sm hover:bg-gray-800 transition-colors">
              <PlusIcon className="w-5 h-5 mr-2" /> Create First Path
            </button>
          </div>
        )}
      </main>

      {pathToDelete && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center" onClick={() => setPathToDelete(null)}>
            <div className="bg-brand-primary rounded-lg shadow-xl p-6 w-full max-w-sm m-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-brand-text">Delete Path?</h3>
                <p className="text-gray-600 my-4">Are you sure you want to delete the path titled "{pathToDelete.title}"? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setPathToDelete(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-brand-text hover:bg-brand-secondary font-medium">Cancel</button>
                    <button onClick={handleDeleteConfirm} className="px-4 py-2 rounded-lg bg-brand-primary text-brand-text border-2 border-brand-text font-semibold hover:bg-brand-secondary">Delete</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathsView;