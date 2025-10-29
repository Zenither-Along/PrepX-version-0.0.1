import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthContextType } from '../types';

// Add password to user type for this client-side simulation
interface SimUser extends User {
    password?: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const getUsersFromStorage = (): SimUser[] => {
    try {
        const users = localStorage.getItem('prepXUsers');
        return users ? JSON.parse(users) : [];
    } catch (e) {
        console.error("Failed to parse users from localStorage", e);
        return [];
    }
};

const getStoredUser = (): User | null => {
    try {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error("Failed to parse current user from localStorage", e);
        return null;
    }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<SimUser[]>(getUsersFromStorage());
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect runs once on mount to confirm initial auth state is loaded.
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Persist the full user list whenever it changes
    try {
      localStorage.setItem('prepXUsers', JSON.stringify(users));
    } catch (e) {
      console.error("Failed to save users to localStorage", e);
    }
  }, [users]);

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string; }> => {
    const user = users.find(u => u.username === username);
    if (user && user.password === password) {
      const userToStore = { id: user.id, username: user.username };
      localStorage.setItem('currentUser', JSON.stringify(userToStore));
      setCurrentUser(userToStore);
      return { success: true, message: 'Login successful' };
    }
    return { success: false, message: 'Incorrect username or password. Please check your credentials and try again.' };
  };

  const register = async (username: string, password: string): Promise<{ success: boolean; message: string; }> => {
    if (users.some(u => u.username === username)) {
      return { success: false, message: 'This username is already taken. Please choose a different one.' };
    }
    const newUser: SimUser = { id: crypto.randomUUID(), username, password };
    setUsers(prev => [...prev, newUser]);
    
    const userToStore = { id: newUser.id, username: newUser.username };
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
    setCurrentUser(userToStore);
    return { success: true, message: 'Registration successful' };
  };
  
  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string; }> => {
      if (!currentUser) {
          return { success: false, message: 'You must be logged in to change your password.' };
      }
      const user = users.find(u => u.username === currentUser.username);
      if (!user || user.password !== currentPassword) {
          return { success: false, message: 'Your current password is incorrect.' };
      }
      
      const updatedUsers = users.map(u => 
          u.username === currentUser.username ? { ...u, password: newPassword } : u
      );
      setUsers(updatedUsers);
      
      return { success: true, message: 'Password updated successfully!' };
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    token: null, // No token in client-side auth
    isLoading,
    login,
    register,
    logout,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};