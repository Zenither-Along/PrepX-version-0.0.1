
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { LearningPath, PathStatus, PathContextType, ColumnType } from '../types';

export const PathContext = createContext<PathContextType | null>(null);

export const PathProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [majorPath, setMajorPathState] = useState<LearningPath | null>(null);

  useEffect(() => {
    try {
      const storedPaths = localStorage.getItem('learningPaths');
      if (storedPaths) {
        const parsedPaths: LearningPath[] = JSON.parse(storedPaths);
        setPaths(parsedPaths);
        const currentMajorPath = parsedPaths.find(p => p.isMajor) || null;
        setMajorPathState(currentMajorPath);
      }
    // Fix: Added curly braces to the catch block to fix syntax error.
    } catch (error) {
      console.error("Failed to load paths from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('learningPaths', JSON.stringify(paths));
      const currentMajorPath = paths.find(p => p.isMajor) || null;
      setMajorPathState(currentMajorPath);
    } catch (error) {
      console.error("Failed to save paths to localStorage", error);
    }
  }, [paths]);

  const addPath = useCallback((title: string): LearningPath => {
    const newPath: LearningPath = {
      id: crypto.randomUUID(),
      title,
      columns: [{
        id: crypto.randomUUID(),
        title: 'Phase',
        type: ColumnType.BRANCH,
        parentItemId: null,
        width: 320,
        items: [],
        sections: []
      }],
      status: PathStatus.Completed,
      createdAt: new Date().toISOString(),
      isMajor: false, // This will be determined inside setPaths
    };
    
    setPaths(prevPaths => {
      const isFirstPath = prevPaths.length === 0;
      const finalPath = { ...newPath, isMajor: isFirstPath };
      return [...prevPaths, finalPath];
    });

    // Note: The returned path won't have the correct `isMajor` status immediately,
    // but this is okay as the component creating it only needs the ID.
    return newPath;
  }, []);

  const updatePath = useCallback((updatedPath: LearningPath) => {
    setPaths(prevPaths =>
      prevPaths.map(p => (p.id === updatedPath.id ? updatedPath : p))
    );
  }, []);

  const deletePath = useCallback((id: string) => {
    setPaths(prevPaths => prevPaths.filter(p => p.id !== id));
  }, []);

  const setMajorPath = useCallback((id: string) => {
    setPaths(prevPaths =>
      prevPaths.map(p => ({
        ...p,
        isMajor: p.id === id,
      }))
    );
  }, []);
  
  const getPathById = useCallback((id: string): LearningPath | undefined => {
    return paths.find(p => p.id === id);
  }, [paths]);


  return (
    <PathContext.Provider value={{ paths, majorPath, addPath, updatePath, deletePath, setMajorPath, getPathById }}>
      {children}
    </PathContext.Provider>
  );
};