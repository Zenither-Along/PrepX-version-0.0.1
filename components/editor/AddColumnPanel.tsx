import React, { useState } from 'react';
import { ColumnType } from '../../types';
import { PlusIcon, BookIcon } from '../icons';

export const AddColumnPanel: React.FC<{ isActive: boolean; onCreate: (type: ColumnType) => void; isMobile?: boolean }> = ({ isActive, onCreate, isMobile = false }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleCreate = (type: ColumnType) => {
        onCreate(type);
        setIsMenuOpen(false);
    };
    
    if (isMobile) {
        return (
            <div className="relative">
                <button
                    onClick={() => isActive && setIsMenuOpen(prev => !prev)}
                    disabled={!isActive}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 bg-brand-text text-brand-primary shadow-lg hover:bg-gray-800"
                >
                    <PlusIcon className="w-8 h-8" />
                </button>
                {isMenuOpen && (
                    <div className="absolute z-10 bottom-full right-0 mb-2 w-48 bg-brand-primary rounded-md shadow-lg border border-brand-accent p-2 space-y-2">
                        <p className="text-xs text-gray-500 px-2">Add new column:</p>
                        <button onClick={() => handleCreate(ColumnType.BRANCH)} className="w-full flex items-center p-2 text-sm rounded-md hover:bg-brand-secondary">
                            <BookIcon className="w-4 h-4 mr-2" /> Branch
                        </button>
                        <button onClick={() => handleCreate(ColumnType.DYNAMIC)} className="w-full flex items-center p-2 text-sm rounded-md hover:bg-brand-secondary">
                            <PlusIcon className="w-4 h-4 mr-2" /> Content
                        </button>
                    </div>
                )}
            </div>
        );
    }


    return (
        <div className="flex-shrink-0 h-full flex items-center justify-center relative border-r border-brand-accent" style={{ width: 120 }}>
            <button
                onClick={() => isActive && setIsMenuOpen(prev => !prev)}
                disabled={!isActive}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? 'bg-brand-secondary hover:bg-brand-accent cursor-pointer' : 'bg-gray-100 cursor-not-allowed'
                }`}
            >
                <PlusIcon className={`w-8 h-8 ${isActive ? 'text-brand-text' : 'text-gray-400'}`} />
            </button>

            {isMenuOpen && (
                <div className="absolute z-10 top-1/2 -translate-y-1/2 left-full ml-2 w-48 bg-brand-primary rounded-md shadow-lg border border-brand-accent p-2 space-y-2">
                    <p className="text-xs text-gray-500 px-2">Add new column:</p>
                    <button onClick={() => handleCreate(ColumnType.BRANCH)} className="w-full flex items-center p-2 text-sm rounded-md hover:bg-brand-secondary">
                        <BookIcon className="w-4 h-4 mr-2" /> Branch
                    </button>
                    <button onClick={() => handleCreate(ColumnType.DYNAMIC)} className="w-full flex items-center p-2 text-sm rounded-md hover:bg-brand-secondary">
                        <PlusIcon className="w-4 h-4 mr-2" /> Content
                    </button>
                </div>
            )}
        </div>
    );
};
