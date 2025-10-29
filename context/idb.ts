import { LearningPath } from '../types';

const DB_NAME = 'PrepXDB';
const DB_VERSION = 1;
const STORE_NAME = 'learning_paths';

// Use a singleton promise pattern to avoid race conditions on DB initialization
let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
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
        });
    }
    return dbPromise;
};

export const getAllPaths = async (): Promise<LearningPath[]> => {
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
            reject(new Error("Could not fetch paths from the database."));
        };
    });
};

export const putPath = async (path: LearningPath): Promise<LearningPath> => {
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
            reject(new Error("Could not save the path to the database."));
        };
    });
};

export const deletePathDB = async (pathId: string): Promise<void> => {
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
            reject(new Error("Could not delete the path from the database."));
        };
    });
};
