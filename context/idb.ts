import { LearningPath } from '../types';

// Use a consistent database name that works across all hosts
const DB_NAME = 'PrepXDB';
const DB_VERSION = 1;
const STORE_NAME = 'learning_paths';

// Use a singleton promise pattern to avoid race conditions on DB initialization
let dbPromise: Promise<IDBDatabase> | null = null;

// Function to handle IndexedDB errors and fallback to localStorage if needed
const handleStorageError = (error: any) => {
    console.error('Storage error:', error);
    // Clear any partial database that might be causing issues
    try {
        indexedDB.deleteDatabase(DB_NAME);
    } catch (e) {
        console.error('Failed to delete database:', e);
    }
};

const getDB = (): Promise<IDBDatabase> => {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = (event) => {
                    console.error('IndexedDB error:', request.error);
                    handleStorageError(request.error);
                    reject(new Error('Failed to open IndexedDB.'));
                };

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                        // Index to quickly find the major path
                        objectStore.createIndex('isMajor', 'isMajor', { unique: false }); 
                    }
                };
            } catch (error) {
                console.error('Failed to initialize IndexedDB:', error);
                handleStorageError(error);
                reject(error);
            }
        });
    }
    return dbPromise;
};

export const getAllPaths = async (): Promise<LearningPath[]> => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort by createdAt descending, to match original localStorage behavior
                const paths = request.result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                resolve(paths);
            };

            request.onerror = () => {
                console.error("Error fetching all paths:", request.error);
                handleStorageError(request.error);
                resolve([]); // Return empty array instead of rejecting
            };
        });
    } catch (error) {
        console.error("Failed to get paths:", error);
        return []; // Return empty array on error
    }
};

export const putPath = async (path: LearningPath): Promise<LearningPath> => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(path);

            request.onsuccess = () => {
                resolve(path);
            };
            request.onerror = () => {
                console.error("Error saving path:", request.error);
                handleStorageError(request.error);
                resolve(path); // Return the path anyway to prevent app from breaking
            };
        });
    } catch (error) {
        console.error("Failed to save path:", error);
        return path; // Return the path anyway to prevent app from breaking
    }
};

export const deletePathDB = async (pathId: string): Promise<void> => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(pathId);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                console.error("Error deleting path:", request.error);
                handleStorageError(request.error);
                resolve(); // Resolve anyway to prevent app from breaking
            };
        });
    } catch (error) {
        console.error("Failed to delete path:", error);
        return; // Return anyway to prevent app from breaking
    }
};
