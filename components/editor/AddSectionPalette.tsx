import React from 'react';
import { SectionType } from '../../types';
import { PlusIcon } from '../icons';

export const ADD_BRANCH_ACTION = 'ADD_BRANCH_ACTION';

export const AddSectionPalette: React.FC<{ onAdd: (type: SectionType | typeof ADD_BRANCH_ACTION) => void }> = ({ onAdd }) => {
    // FIX: Cast Object.values to SectionType[] to resolve typing issues.
    const sectionTypes = Object.values(SectionType) as SectionType[];
    return (
        <div className="flex-shrink-0 mt-auto p-2 border-t border-brand-accent bg-brand-secondary">
             <div className="flex flex-wrap gap-2 justify-center">
                {sectionTypes.map(type => (
                    <button key={type} onClick={() => onAdd(type)} className="px-3 py-1 text-xs bg-brand-primary border border-gray-300 rounded-full hover:bg-brand-accent hover:border-gray-400">
                        + {type.charAt(0) + type.slice(1).toLowerCase().replace("_", "-")}
                    </button>
                ))}
            </div>
            <button onClick={() => onAdd(ADD_BRANCH_ACTION)} className="w-full mt-2 px-3 py-2 text-sm bg-blue-100 text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-200 font-semibold flex items-center justify-center gap-2">
                <PlusIcon className="w-4 h-4" /> New Content Column
            </button>
        </div>
    )
};