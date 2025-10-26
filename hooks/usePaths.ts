
import { useContext } from 'react';
import { PathContext } from '../context/PathContext';
import { PathContextType } from '../types';

export const usePaths = (): PathContextType => {
  const context = useContext(PathContext);
  if (!context) {
    throw new Error('usePaths must be used within a PathProvider');
  }
  return context;
};
