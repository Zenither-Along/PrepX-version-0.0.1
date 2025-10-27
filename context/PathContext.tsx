import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { LearningPath, PathStatus, PathContextType, ColumnType } from '../types';

export const PathContext = createContext<PathContextType | null>(null);

const getInitialPaths = (): LearningPath[] => {
  try {
    const storedPaths = localStorage.getItem('learningPaths');
    if (storedPaths) {
      const parsedPaths = JSON.parse(storedPaths);
      if (Array.isArray(parsedPaths)) {
        return parsedPaths;
      }
    }
  } catch (error) {
    console.error("Failed to load or parse paths from localStorage during initialization. Starting fresh.", error);
  }
  return [];
};

export const PathProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [paths, setPaths] = useState<LearningPath[]>(getInitialPaths);

  useEffect(() => {
    try {
      localStorage.setItem('learningPaths', JSON.stringify(paths));
    } catch (error) {
      console.error("Failed to save paths to localStorage", error);
    }
  }, [paths]);

  const majorPath = useMemo(() => {
    return paths.find(p => p && p.isMajor) || null;
  }, [paths]);

  const addPath = useCallback((title: string, callback: (newPath: LearningPath) => void) => {
    const isFirstPath = paths.length === 0;
    
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
      isMajor: isFirstPath,
    };
    
    setPaths(prevPaths => [...prevPaths, newPath]);
    callback(newPath);
  }, [paths]);

  const updatePath = useCallback((updatedPath: LearningPath) => {
    setPaths(prevPaths =>
      prevPaths.map(p => (p.id === updatedPath.id ? updatedPath : p))
    );
  }, []);

  const deletePath = useCallback((id: string) => {
    setPaths(prevPaths => {
        const pathToDelete = prevPaths.find(p => p.id === id);
        const remainingPaths = prevPaths.filter(p => p.id !== id);
        if (pathToDelete?.isMajor && remainingPaths.length > 0) {
            const newMajorPathIndex = remainingPaths.findIndex(p => !p.isMajor);
            if (newMajorPathIndex !== -1) {
                 remainingPaths[newMajorPathIndex].isMajor = true;
            } else {
                 remainingPaths[0].isMajor = true;
            }
        }
        return remainingPaths;
    });
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
