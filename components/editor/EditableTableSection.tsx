import React, { useState } from 'react';
import { PlusIcon, MinusCircleIcon, XIcon, EditIcon } from '../icons';
import { AutoSizingTextArea } from '../common/AutoSizingTextArea';

interface EditableTableSectionProps {
    content: {
        cells: string[][];
    };
    onContentChange: (newContent: { cells: string[][] }) => void;
    isEditing: boolean;
    setIsEditing: (isEditing: boolean) => void;
    isSelected: boolean;
    isMobile: boolean;
}

const TableEditorModal: React.FC<{
    initialCells: string[][];
    onSave: (newCells: string[][]) => void;
    onClose: () => void;
}> = ({ initialCells, onSave, onClose }) => {
    const [cells, setCells] = useState(initialCells);
    const numRows = cells.length;
    const numCols = cells[0]?.length || 1;

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newCells = cells.map(row => [...row]);
        newCells[rowIndex][colIndex] = value;
        setCells(newCells);
    };

    const addRow = () => setCells(prev => [...prev.map(r => [...r]), Array(numCols).fill('')]);
    const deleteRow = (rowIndex: number) => {
        if (numRows <= 1) return;
        setCells(prev => prev.filter((_, i) => i !== rowIndex));
    };
    const addColumn = () => setCells(prev => prev.map(row => [...row, '']));
    const deleteColumn = (colIndex: number) => {
        if (numCols <= 1) return;
        setCells(prev => prev.map(row => row.filter((_, i) => i !== colIndex)));
    };
    
    const handleSave = () => {
        onSave(cells);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col p-4" onClick={onClose}>
            <div className="w-full max-w-4xl mx-auto bg-brand-primary rounded-lg shadow-xl flex flex-col h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-brand-accent">
                    <h3 className="text-lg font-bold">Edit Table</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-secondary">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                <main className="flex-grow p-4 overflow-auto">
                     <div className="overflow-auto">
                        <table className="w-full text-sm border-collapse">
                             <thead>
                                <tr>
                                    {Array.from({ length: numCols }).map((_, colIndex) => (
                                        <th key={colIndex} className="p-1 border-b-2 border-gray-300">
                                            <button onClick={() => deleteColumn(colIndex)} disabled={numCols <= 1} className="p-1 text-gray-400 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed mx-auto block">
                                                <MinusCircleIcon className="w-4 h-4" />
                                            </button>
                                        </th>
                                    ))}
                                    <th className="border-b-2 border-gray-300 w-8"></th> 
                                </tr>
                            </thead>
                            <tbody>
                                {cells.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {row.map((cell, colIndex) => (
                                            <td key={colIndex} className="border border-gray-300 p-0 align-top">
                                                <AutoSizingTextArea value={cell} onChange={(val) => handleCellChange(rowIndex, colIndex, val)} className="w-full h-full bg-transparent p-2 focus:ring-1 focus:ring-gray-800 focus:outline-none" rows={1} />
                                            </td>
                                        ))}
                                        <td className="p-1 w-8 text-center border-t border-r border-b border-gray-300 border-l-transparent align-middle bg-gray-50">
                                            <button onClick={() => deleteRow(rowIndex)} disabled={numRows <= 1} className="p-1 text-gray-400 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed">
                                                <MinusCircleIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="flex gap-2 mt-2">
                        <button onClick={addRow} className="flex-1 flex items-center justify-center gap-2 p-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-300">
                            <PlusIcon className="w-3 h-3" /> Row
                        </button>
                        <button onClick={addColumn} className="flex-1 flex items-center justify-center gap-2 p-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-300">
                            <PlusIcon className="w-3 h-3" /> Column
                        </button>
                    </div>
                </main>
                <footer className="flex-shrink-0 flex justify-end p-4 border-t border-brand-accent">
                    <button onClick={handleSave} className="px-5 py-2 bg-brand-text text-brand-primary font-semibold rounded-lg shadow-sm hover:bg-gray-800">Done</button>
                </footer>
            </div>
        </div>
    );
};

export const EditableTableSection: React.FC<EditableTableSectionProps> = ({ content, onContentChange, isEditing, setIsEditing, isSelected, isMobile }) => {
    const cells = content?.cells && content.cells.length > 0 && content.cells[0]?.length > 0 ? content.cells : [['']];
    const [isModalOpen, setIsModalOpen] = useState(false);

    React.useEffect(() => {
        if (isEditing) {
            setIsModalOpen(true);
        }
    }, [isEditing]);
    
    const handleModalSave = (newCells: string[][]) => {
        onContentChange({ cells: newCells });
        setIsEditing(false);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setIsEditing(false);
    };
    
    if (isMobile) {
        return (
            <div className="relative">
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                    <table className="w-full text-sm text-left text-brand-text">
                        <tbody>
                            {cells.map((row: string[], rowIndex: number) => (
                                <tr key={rowIndex} className="border-b border-gray-300 last:border-b-0">
                                    {row.map((cell: string, cellIndex: number) => (
                                        <td key={cellIndex} className="p-3 border-r border-gray-300 last:border-r-0">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {isSelected && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-full shadow-md text-sm font-medium"
                    >
                        <EditIcon className="w-4 h-4" /> Edit Table
                    </button>
                )}
                {isModalOpen && (
                    <TableEditorModal 
                        initialCells={cells}
                        onSave={handleModalSave}
                        onClose={handleModalClose}
                    />
                )}
            </div>
        );
    }
    
    // Desktop view (inline)
    const numRows = cells.length;
    const numCols = cells[0]?.length || 1;

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newCells = cells.map(row => [...row]);
        newCells[rowIndex][colIndex] = value;
        onContentChange({ cells: newCells });
    };

    const addRow = () => onContentChange({ cells: [...cells.map(row => [...row]), Array(numCols).fill('')] });
    const deleteRow = (rowIndex: number) => {
        if (numRows <= 1) return;
        onContentChange({ cells: cells.filter((_, i) => i !== rowIndex) });
    };
    const addColumn = () => onContentChange({ cells: cells.map(row => [...row, '']) });
    const deleteColumn = (colIndex: number) => {
        if (numCols <= 1) return;
        onContentChange({ cells: cells.map(row => row.filter((_, i) => i !== colIndex)) });
    };

    return (
        <div className="p-2 border border-gray-200 rounded-md bg-brand-primary">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr>
                            {Array.from({ length: numCols }).map((_, colIndex) => (
                                <th key={colIndex} className="p-1 border-b-2 border-gray-300">
                                    <button onClick={(e) => { e.stopPropagation(); deleteColumn(colIndex); }} disabled={numCols <= 1} className="p-1 text-gray-400 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed mx-auto block">
                                        <MinusCircleIcon className="w-4 h-4" />
                                    </button>
                                </th>
                            ))}
                            <th className="border-b-2 border-gray-300 w-8"></th> 
                        </tr>
                    </thead>
                    <tbody>
                        {cells.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, colIndex) => (
                                    <td key={colIndex} className="border border-gray-300 p-0 align-top" onClick={e => e.stopPropagation()}>
                                        <AutoSizingTextArea value={cell} onChange={(val) => handleCellChange(rowIndex, colIndex, val)} className="w-full h-full bg-transparent p-2 focus:ring-1 focus:ring-gray-800 focus:outline-none" rows={1} />
                                    </td>
                                ))}
                                <td className="p-1 w-8 text-center border-t border-r border-b border-gray-300 border-l-transparent align-middle bg-gray-50">
                                    <button onClick={(e) => { e.stopPropagation(); deleteRow(rowIndex); }} disabled={numRows <= 1} className="p-1 text-gray-400 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed">
                                        <MinusCircleIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex gap-2 mt-2">
                <button onClick={(e) => { e.stopPropagation(); addRow(); }} className="flex-1 flex items-center justify-center gap-2 p-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-300">
                    <PlusIcon className="w-3 h-3" /> Row
                </button>
                <button onClick={(e) => { e.stopPropagation(); addColumn(); }} className="flex-1 flex items-center justify-center gap-2 p-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-300">
                    <PlusIcon className="w-3 h-3" /> Column
                </button>
            </div>
        </div>
    );
};