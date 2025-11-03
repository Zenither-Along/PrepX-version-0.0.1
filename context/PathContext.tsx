import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { LearningPath, PathContextType, ColumnType } from '../types';
import { useAuth } from '../hooks/useAuth';
import * as idb from './idb';
import { getSelfLearningPath, SELF_LEARNING_PATH_ID } from '../prebuilt/selfLearningPath';

// Generate a UUID that works across all browsers including mobile
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const PathContext = createContext<PathContextType | undefined>(undefined);

interface PathProviderProps {
  children: ReactNode;
}

export const PathProvider: React.FC<PathProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [majorPath, setMajorPath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      // NOTE: This implementation of IndexedDB is not user-scoped. 
      // For this app, we'll assume a single user context.
      if (currentUser) {
        try {
          let userPaths = await idb.getAllPaths();
          
          // Check if the pre-built path exists, and add it if it doesn't.
          const prebuiltPathExists = userPaths.some(p => p.id === SELF_LEARNING_PATH_ID);
          if (!prebuiltPathExists) {
            const prebuiltPath = getSelfLearningPath();
            await idb.putPath(prebuiltPath);
            userPaths = [prebuiltPath, ...userPaths]; // Add it to the start of the list for visibility
          }

          setPaths(userPaths);
          setMajorPath(userPaths.find(p => p.isMajor) || null);
        } catch (e) {
          console.error("Failed to load paths from IndexedDB", e);
          // Add the prebuilt path even if there's an error
          const prebuiltPath = getSelfLearningPath();
          setPaths([prebuiltPath]);
          setError("Could not load all your learning paths. Some features may be limited.");
        }
      } else {
        setPaths([]);
        setMajorPath(null);
      }
      setIsLoading(false);
    };
    
    loadData();
  }, [currentUser]);

  const addPath = async (title: string, callback: (newPath: LearningPath) => void) => {
    const isFirstPath = paths.length === 0;
    const newPath: LearningPath = {
      id: generateUUID(),
      title,
      isMajor: isFirstPath,
      createdAt: new Date().toISOString(),
      columns: [{
        id: generateUUID(),
        title,
        type: ColumnType.BRANCH,
        parentItemId: null,
        width: 320,
        items: [],
        sections: []
      }]
    };
    try {
      await idb.putPath(newPath);
      const newPaths = [newPath, ...paths];
      setPaths(newPaths);
      if (newPath.isMajor) {
        setMajorPath(newPath);
      }
      callback(newPath);
    } catch(e) {
        console.error("Failed to save path", e);
        setError("Could not save your new path. The database may be unavailable.");
    }
  };

  const getPathById = (id: string) => {
    return paths.find(p => p.id === id);
  };

  const updatePath = async (updatedPath: LearningPath) => {
    try {
      await idb.putPath(updatedPath);
      const newPaths = paths.map(p => p.id === updatedPath.id ? updatedPath : p);
      setPaths(newPaths);
      if (updatedPath.isMajor) {
        setMajorPath(updatedPath);
      } else if (majorPath?.id === updatedPath.id && !updatedPath.isMajor) {
        setMajorPath(null);
      }
    } catch (e) {
      console.error("Failed to update path", e);
      setError("Could not save your changes. The database may be unavailable.");
    }
  };

  const deletePath = async (id: string) => {
    try {
      await idb.deletePathDB(id);
      const newPaths = paths.filter(p => p.id !== id);
      setPaths(newPaths);
      if (majorPath?.id === id) {
         const nextMajor = newPaths.find(p => p.isMajor) || null;
         setMajorPath(nextMajor || null);
      }
    } catch (e) {
      console.error("Failed to delete path", e);
      setError("Could not delete the path. The database may be unavailable.");
    }
  };

  const handleSetMajorPath = async (id: string) => {
    const newMajorPath = paths.find(p => p.id === id);
    if (!newMajorPath) return;

    try {
        const updates: Promise<LearningPath>[] = [];
        const oldMajorPath = paths.find(p => p.isMajor);
        if (oldMajorPath && oldMajorPath.id !== id) {
            updates.push(idb.putPath({ ...oldMajorPath, isMajor: false }));
        }
        updates.push(idb.putPath({ ...newMajorPath, isMajor: true }));

        await Promise.all(updates);

        const newPaths = paths.map(p => ({
            ...p,
            isMajor: p.id === id
        }));
        setPaths(newPaths);
        setMajorPath(newPaths.find(p => p.isMajor) || null);

    } catch (e) {
      console.error("Failed to set major path", e);
      setError("Could not update the major path. The database may be unavailable.");
    }
  };

  const removeMajorPath = async () => {
    const currentMajorPath = paths.find(p => p.isMajor);
    if (!currentMajorPath) return;

    try {
        await idb.putPath({ ...currentMajorPath, isMajor: false });

        const newPaths = paths.map(p => 
            p.id === currentMajorPath.id ? { ...p, isMajor: false } : p
        );
        setPaths(newPaths);
        setMajorPath(null);
    } catch (e) {
      console.error("Failed to remove major path", e);
      setError("Could not update the major path. The database may be unavailable.");
    }
  };

  const value: PathContextType = {
    paths,
    majorPath,
    isLoading,
    error,
    addPath,
    getPathById,
    updatePath,
    deletePath,
    setMajorPath: handleSetMajorPath,
    removeMajorPath,
  };

  return <PathContext.Provider value={value}>{children}</PathContext.Provider>;
};