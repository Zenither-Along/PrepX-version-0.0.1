import React, { useState } from 'react';
import { usePaths } from '../hooks/usePaths';
import { ArrowUpIcon } from './icons';

interface CreatePathViewProps {
  onPathCreated: (pathId: string) => void;
}

const CreatePathView: React.FC<CreatePathViewProps> = ({ onPathCreated }) => {
  const [title, setTitle] = useState('');
  const { addPath } = usePaths();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addPath(title.trim(), (newPath) => {
        onPathCreated(newPath.id);
      });
    }
  };

  return (
    <div className="bg-brand-primary h-full flex flex-col">
      <header className="flex-shrink-0 flex items-center px-4 sm:px-8 border-b border-brand-accent h-16">
        <h1 className="text-2xl font-bold text-brand-text">Create New Path</h1>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="text-center w-full max-w-lg">
          <h2 className="text-[32px] text-gray-800 mb-2 font-serif">Give your path a name.</h2>
          <p className="text-gray-600 mb-6">You can always change it later.</p>
          <form onSubmit={handleSubmit} className="mt-8 w-full max-w-md mx-auto">
            <div className="relative bg-brand-primary p-4 rounded-xl shadow-lg border border-gray-200 h-[120px] flex flex-col">
              <label htmlFor="path-title" className="sr-only">Title</label>
              <textarea
                id="path-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="eg. 'Computer Science', 'Python'"
                className="w-full border-none resize-none focus:ring-0 focus:outline-none bg-transparent text-brand-text placeholder-gray-500 text-lg flex-grow"
                autoFocus
              />
              <div className="mt-2 border-t border-gray-200 relative h-10">
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="absolute bottom-0 right-0 w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full shadow-sm hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                  aria-label="Create path"
                >
                  <ArrowUpIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreatePathView;