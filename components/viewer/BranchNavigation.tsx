import React, { useState, useRef, useEffect } from 'react';
import { LearningPath, PathItem } from '../../types';
import { ChevronDownIcon, ChevronRightIcon } from '../icons';

export const BranchNavigation: React.FC<{
    items: PathItem[];
    path: LearningPath;
    activeItemId: string | null;
    onItemSelect: (itemId: string) => void;
}> = ({ items, path, activeItemId, onItemSelect }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const navItems = items.filter(item => path.columns.some(c => c.parentItemId === item.id));


    if (navItems.length === 0) {
        return null;
    }

    if (navItems.length === 1) {
        const item = navItems[0];
        return (
            <button 
                onClick={() => onItemSelect(item.id)} 
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    activeItemId === item.id 
                        ? 'bg-brand-text text-brand-primary' 
                        : 'bg-brand-secondary hover:bg-brand-accent'
                }`}
            >
                <span className="truncate max-w-[120px]">{item.title}</span>
                <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
            </button>
        );
    }
    
    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-brand-secondary hover:bg-brand-accent"
            >
                <span>Next Steps</span>
                <ChevronDownIcon className="w-4 h-4" />
            </button>
            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-brand-primary rounded-md shadow-lg z-10 border border-brand-accent p-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onItemSelect(item.id);
                                setIsMenuOpen(false);
                            }}
                            className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-brand-secondary ${
                                activeItemId === item.id ? 'bg-brand-accent' : ''
                            }`}
                        >
                            <span>{item.title}</span>
                            {activeItemId === item.id && <ChevronRightIcon className="w-4 h-4" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};