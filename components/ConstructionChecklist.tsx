
import React, { useState, useEffect, useMemo } from 'react';
import { Contract, ProjectChecklist, ChecklistItemTemplate } from '../types';
import { CHECKLIST_TEMPLATE } from '../constants';
import { CheckCircleIcon } from './Icons';

interface ConstructionChecklistProps {
    contracts: Contract[];
    checklists: ProjectChecklist[];
    onUpdateChecklist: (checklist: ProjectChecklist) => void;
}

const ConstructionChecklist: React.FC<ConstructionChecklistProps> = ({ contracts, checklists = [], onUpdateChecklist }) => {
    const [selectedContractId, setSelectedContractId] = useState<string>('');
    const [localCompletedIds, setLocalCompletedIds] = useState<number[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const activeContracts = contracts.filter(c => c.status === 'Ativo');

    // Carregar dados salvos quando o contrato muda
    useEffect(() => {
        if (selectedContractId) {
            const savedChecklist = (checklists || []).find(c => c.contractId === parseInt(selectedContractId));
            setLocalCompletedIds(savedChecklist ? savedChecklist.completedItemIds : []);
            setHasUnsavedChanges(false);
        } else {
            setLocalCompletedIds([]);
            setHasUnsavedChanges(false);
        }
    }, [selectedContractId, checklists]);

    const handleToggleItem = (itemId: number) => {
        if (!selectedContractId) return;

        setLocalCompletedIds(prev => {
            const isCompleted = prev.includes(itemId);
            if (isCompleted) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
        setHasUnsavedChanges(true);
    };

    const handleSave = () => {
        if (!selectedContractId) return;

        onUpdateChecklist({
            contractId: parseInt(selectedContractId),
            completedItemIds: localCompletedIds
        });
        
        setHasUnsavedChanges(false);
        alert('Checklist salvo com sucesso!');
    };

    // Group items by stage
    const groupedItems = useMemo(() => {
        const groups: { [key: string]: ChecklistItemTemplate[] } = {};
        CHECKLIST_TEMPLATE.forEach(item => {
            if (!groups[item.stage]) {
                groups[item.stage] = [];
            }
            groups[item.stage].push(item);
        });
        return groups;
    }, []);
    
    const calculateProgress = () => {
        if(CHECKLIST_TEMPLATE.length === 0) return 0;
        return Math.round((localCompletedIds.length / CHECKLIST_TEMPLATE.length) * 100);
    }

    return (
        <div className="space-y-8 relative pb-20">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Checklist de Obra</h1>
                <p className="mt-1 text-blue-100">
                    Acompanhe as etapas e tarefas essenciais de cada projeto.
                </p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <label htmlFor="contract-select" className="block text-sm font-medium text-slate-700 mb-2">Selecione o Projeto/Cliente</label>
                <select
                    id="contract-select"
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className="block w-full max-w-md rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                >
                    <option value="">Selecione...</option>
                    {activeContracts.map(contract => (
                        <option key={contract.id} value={contract.id}>
                            {contract.clientName} - {contract.projectName}
                        </option>
                    ))}
                </select>
            </div>

            {selectedContractId && (
                <div className="space-y-6">
                     <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Progresso Total</span>
                        <div className="flex items-center space-x-3 flex-1 max-w-xs ml-4">
                             <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{width: `${calculateProgress()}%`}}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-700">{calculateProgress()}%</span>
                        </div>
                    </div>

                    {Object.entries(groupedItems).map(([stageName, items]) => (
                        <div key={stageName} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                            <h3 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-3 mb-4 sticky top-0 bg-white z-10">
                                {stageName}
                            </h3>
                            <div className="space-y-3">
                                {(items as ChecklistItemTemplate[]).map(item => {
                                    const isChecked = localCompletedIds.includes(item.id);
                                    return (
                                        <label key={item.id} className="flex items-start space-x-3 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleItem(item.id)}
                                                className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0 cursor-pointer"
                                            />
                                            <span className={`text-sm transition-all duration-200 ${isChecked ? 'line-through text-slate-400' : 'text-slate-700 group-hover:text-blue-700'}`}>
                                                {item.text}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Floating Save Button Bar */}
                    <div className="fixed bottom-6 right-6 z-30">
                         <button 
                            onClick={handleSave}
                            className={`flex items-center justify-center px-8 py-4 rounded-full shadow-xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 ${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700 ring-4 ring-blue-300' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            <CheckCircleIcon className="w-6 h-6 mr-2" />
                            {hasUnsavedChanges ? 'Salvar Alterações' : 'Salvo'}
                        </button>
                    </div>
                </div>
            )}
            
            {!selectedContractId && (
                <div className="text-center py-12 text-slate-500 bg-white rounded-xl shadow-lg border border-dashed border-slate-300">
                    <p>Selecione um cliente acima para visualizar e gerenciar o checklist de obra.</p>
                </div>
            )}
        </div>
    );
};

export default ConstructionChecklist;