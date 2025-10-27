import React, { useState } from 'react';
import { DynamicContentSection, SectionType } from '../../types';
import { ChevronDownIcon } from '../icons';
import { VideoThumbnailPlayer } from './VideoThumbnailPlayer';

export const ReadOnlyDynamicColumn: React.FC<{ sections: DynamicContentSection[] }> = ({ sections }) => {
    const regularSections = sections.filter(s => s.type !== SectionType.FLOATING);
    const floatingSections = sections.filter(s => s.type === SectionType.FLOATING);

    return (
        <div className="relative bg-brand-secondary">
             <div className="space-y-6 py-6">
                {regularSections.map(section => (
                    <ReadOnlySection key={section.id} section={section} />
                ))}
            </div>
            {floatingSections.map(section => (
                <div key={section.id} style={{ position: 'absolute', transform: `translate(${section.content.x}px, ${section.content.y}px)`, width: section.content.width, height: section.content.height }}
                    className="bg-gray-100/80 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg p-2 flex flex-col"
                >
                     <p className="text-sm whitespace-pre-wrap">{section.content.text}</p>
                </div>
            ))}
        </div>
    );
};

const ReadOnlySection: React.FC<{ section: DynamicContentSection }> = ({ section }) => {
    switch (section.type) {
        case SectionType.HEADING: return <h2 className="text-2xl font-bold px-4">{section.content?.text}</h2>;
        case SectionType.SUB_HEADING: return <h3 className="text-xl font-semibold text-gray-700 px-4">{section.content?.text}</h3>;
        case SectionType.PARAGRAPH: return <p className="whitespace-pre-wrap px-4">{section.content?.text}</p>;
        case SectionType.IMAGE: return (
            <div style={{ width: `${section.content.width || 100}%`, margin: '0 auto' }}>
                <img src={section.content.src} alt="content" className="w-full h-auto" />
            </div>
        );
        case SectionType.VIDEO: {
            return (
                <div style={{ width: `${section.content.width || 100}%`, margin: '0 auto' }}>
                    <VideoThumbnailPlayer url={section.content?.url} />
                </div>
            );
        }
        case SectionType.BULLETS:
            const ListTag = section.content.ordered ? 'ol' : 'ul';
            const listClass = section.content.ordered ? 'list-decimal' : 'list-disc';
            return <ListTag className={`${listClass} list-outside pl-8 pr-4`}>
                {section.content.items.map((item: string, index: number) => <li key={index} className="mb-1">{item}</li>)}
            </ListTag>;
        case SectionType.QANDA: {
            const [isCollapsed, setIsCollapsed] = useState(true);
            return (
                <div 
                    className="bg-brand-primary px-4 cursor-pointer"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-start justify-between gap-4 py-3">
                        <div className="flex items-start gap-2">
                            <p className="font-bold text-gray-700">Q:</p>
                            <p className="font-bold flex-1">{section.content.question}</p>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 mt-1 transition-transform flex-shrink-0 text-gray-500 ${!isCollapsed ? 'rotate-180' : ''}`} />
                    </div>
                    {!isCollapsed && (
                        <div className="flex items-start gap-2 pb-3 pl-[26px] border-t border-brand-accent pt-3">
                            <p className="font-bold text-gray-700">A:</p>
                            <p className="flex-1 whitespace-pre-wrap text-gray-800">{section.content.answer}</p>
                        </div>
                    )}
                </div>
            );
        }
        case SectionType.LINK: return <a href={section.content.url} target="_blank" rel="noopener noreferrer" className="block py-3 px-4 border-y border-brand-accent text-blue-600 hover:bg-blue-50 bg-brand-primary">
                <span className="font-medium">{section.content.text}</span>
                <span className="text-xs text-gray-500 block truncate">{section.content.url}</span>
            </a>;
        default: return null;
    }
};
