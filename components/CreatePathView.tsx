import React, { useState } from 'react';
import { usePaths } from '../hooks/usePaths';
import { PlusIcon } from './icons';

interface CreatePathViewProps {
  onPathCreated: (pathId: string) => void;
}

const CreatePathView: React.FC<CreatePathViewProps> = ({ onPathCreated }) => {
  const [title, setTitle] = useState('');
  const { addPath } = usePaths();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const newPath = addPath(title.trim());
      onPathCreated(newPath.id);
    }
  };

  return (
    <div className="bg-brand-primary h-full flex flex-col">
      <header className="flex-shrink-0 flex items-center px-4 sm:px-8 border-b border-brand-accent h-16">
        <h1 className="text-2xl font-bold text-brand-text">Create New Path</h1>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Give your path a name.</h2>
          <p className="text-gray-600 mb-6">You can always change it later.</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <label htmlFor="path-title" className="sr-only">Title</label>
            <input
              id="path-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="eg: 'Computer Science', 'Python'"
              className="px-4 py-3 border border-gray-300 rounded-lg w-full max-w-md focus:ring-2 focus:ring-gray-800 focus:border-gray-800 outline-none transition bg-brand-primary text-brand-text"
              autoFocus
            />
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex items-center justify-center px-6 py-3 bg-brand-text text-brand-primary font-semibold rounded-lg shadow-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreatePathView;