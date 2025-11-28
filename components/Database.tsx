
import React, { useState, useEffect, useRef } from 'react';
import { AppData, Client, Contract, Reminder, PaymentInstallment } from '../types';
import { PencilIcon, TrashIcon, XIcon, PlusIcon, ExclamationTriangleIcon, DownloadIcon, UploadIcon } from './Icons';

type TableKey = 'clients' | 'contracts' | 'reminders' | 'installments';

type Item = Client | Contract | Reminder | PaymentInstallment;

interface DatabaseProps {
    appData: AppData;
    setAppData: React.Dispatch<React.SetStateAction<AppData>>;
    onDeleteContract: (id: number) => void;
    onResetData: () => void;
}

const tableConfig: { [K in TableKey]: { title: string; columns: { key: keyof any; label: string }[] } } = {
    clients: {
        title: 'Clientes',
        columns: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Nome' },
        ],
    },
    contracts: {
        title: 'Contratos',
        columns: [
            { key: 'id', label: 'ID' },
            { key: 'clientName', label: 'Cliente' },
            { key: 'projectName', label: 'Projeto' },
            { key: 'totalValue', label: 'Valor Total' },
            { key: 'status', label: 'Status' },
        ],
    },
    reminders: {
        title: 'Lembretes',
        columns: [
            { key: 'id', label: 'ID' },
            { key: 'clientName', label: 'Cliente' },
            { key: 'description', label: 'Descrição' },
            { key: 'date', label: 'Data' },
            { key: 'completed', label: 'Concluído' },
        ],
    },
    installments: {
        title: 'Parcelas',
        columns: [
            { key: 'id', label: 'ID' },
            { key: 'clientName', label: 'Cliente' },
            { key: 'installment', label: 'Parcela' },
            { key: 'dueDate', label: 'Vencimento' },
            { key: 'value', label: 'Valor' },
            { key: 'status', label: 'Status' },
        ],
    },
};

const Database: React.FC<DatabaseProps> = ({ appData, setAppData, onDeleteContract, onResetData }) => {
    const [activeTable, setActiveTable] = useState<TableKey>('clients');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [formData, setFormData] = useState<Partial<Item>>({});
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const importInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        setSelectedIds(new Set());
    }, [activeTable]);

    const openModal = (item: Item | null = null) => {
        setEditingItem(item);
        setFormData(item ? { ...item } : {});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: any = value;
        if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            processedValue = value === '' ? '' : parseFloat(value);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSave = () => {
        if (!activeTable) return;
        
        setAppData(prevData => {
            const currentItems = (prevData[activeTable] || []) as Item[];
            let newItems;
            if (editingItem) {
                newItems = currentItems.map(item => item.id === editingItem.id ? { ...item, ...formData } : item);
            } else {
                const newItem: Item = { ...formData, id: Date.now() } as Item;
                newItems = [...currentItems, newItem];
            }
            return { ...prevData, [activeTable]: newItems };
        });
        
        closeModal();
    };
    
    const handleDelete = (id: number) => {
        const isContract = activeTable === 'contracts';
        const isClient = activeTable === 'clients';
        
        let confirmationMessage = 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.';
        if (isContract) {
            confirmationMessage = 'Tem certeza que deseja excluir este contrato? Esta ação também excluirá parcelas, cronogramas e checklists associados.';
        } else if (isClient) {
            confirmationMessage = 'Tem certeza que deseja excluir este cliente? Todos os contratos, parcelas e lembretes associados a ele também serão excluídos.';
        }

        if (window.confirm(confirmationMessage)) {
            if (isContract) {
                onDeleteContract(id);
            } else if (isClient) {
                const clientToDelete = appData.clients.find(c => c.id === id);
                if (!clientToDelete) return;

                setAppData(prev => {
                    const contractIdsToDelete = prev.contracts
                        .filter(contract => contract.clientName === clientToDelete.name)
                        .map(contract => contract.id);

                    return {
                        ...prev,
                        clients: prev.clients.filter(c => c.id !== id),
                        contracts: prev.contracts.filter(c => c.clientName !== clientToDelete.name),
                        reminders: prev.reminders.filter(r => r.clientId !== id),
                        installments: prev.installments.filter(i => !contractIdsToDelete.includes(i.contractId)),
                        schedules: prev.schedules.filter(s => !contractIdsToDelete.includes(s.contractId)),
                        projectProgress: prev.projectProgress?.filter(p => !contractIdsToDelete.includes(p.contractId)),
                        checklists: prev.checklists ? prev.checklists.filter(c => !contractIdsToDelete.includes(c.contractId)) : [],
                    };
                });
            } else {
                setAppData(prevData => {
                    const currentItems = (prevData[activeTable] as Item[]) || [];
                    const newItems = currentItems.filter(item => item.id !== id);
                    return { ...prevData, [activeTable]: newItems };
                });
            }
        }
    };

    const handleDeleteSelected = () => {
        let confirmationMessage = `Tem certeza que deseja excluir os ${selectedIds.size} itens selecionados? Esta ação não pode ser desfeita.`;
        if (activeTable === 'contracts') {
            confirmationMessage = `Tem certeza que deseja excluir os ${selectedIds.size} contratos selecionados? Suas parcelas e cronogramas associados também serão excluídos.`;
        } else if (activeTable === 'clients') {
            confirmationMessage = `Tem certeza que deseja excluir os ${selectedIds.size} clientes selecionados? Todos os seus dados (contratos, parcelas, lembretes) também serão excluídos.`;
        }

        if (window.confirm(confirmationMessage)) {
            if (activeTable === 'contracts') {
                selectedIds.forEach(id => onDeleteContract(id));
            } else if (activeTable === 'clients') {
                const clientsToDelete = appData.clients.filter(c => selectedIds.has(c.id));
                const clientNamesToDelete = new Set(clientsToDelete.map(c => c.name));
                const clientIdsToDelete = new Set(clientsToDelete.map(c => c.id));
                
                setAppData(prev => {
                    const contractIdsToDelete = new Set(
                        prev.contracts
                            .filter(contract => clientNamesToDelete.has(contract.clientName))
                            .map(contract => contract.id)
                    );

                    return {
                        ...prev,
                        clients: prev.clients.filter(c => !clientIdsToDelete.has(c.id)),
                        contracts: prev.contracts.filter(c => !clientNamesToDelete.has(c.clientName)),
                        reminders: prev.reminders.filter(r => !clientIdsToDelete.has(r.clientId)),
                        installments: prev.installments.filter(i => !contractIdsToDelete.has(i.contractId)),
                        schedules: prev.schedules.filter(s => !contractIdsToDelete.has(s.contractId)),
                        projectProgress: prev.projectProgress?.filter(p => !contractIdsToDelete.has(p.contractId)),
                        checklists: prev.checklists ? prev.checklists.filter(c => !contractIdsToDelete.has(c.contractId)) : [],
                    };
                });
            } else {
                setAppData(prevData => {
                    const currentItems = (prevData[activeTable] as Item[]) || [];
                    const newItems = currentItems.filter(item => !selectedIds.has(item.id));
                    return { ...prevData, [activeTable]: newItems };
                });
            }
            setSelectedIds(new Set());
        }
    };

    const allVisibleItems = (appData[activeTable] as Item[] || []);
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(allVisibleItems.map(item => item.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const handleSelectItem = (id: number) => {
        setSelectedIds(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(id)) {
                newSelection.delete(id);
            } else {
                newSelection.add(id);
            }
            return newSelection;
        });
    };

    const handleExportData = () => {
        try {
            const dataStr = JSON.stringify(appData, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            const date = new Date().toISOString().split('T')[0];
            link.download = `e-projet_backup_${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erro ao exportar dados:", error);
            alert("Não foi possível exportar os dados.");
        }
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm('Tem certeza que deseja importar este arquivo? Todos os dados atuais serão substituídos. Esta ação não pode ser desfeita.')) {
            if(importInputRef.current) importInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("O arquivo não pôde ser lido.");
                
                const importedData = JSON.parse(text);

                if (importedData && typeof importedData === 'object' && 'contracts' in importedData && 'clients' in importedData) {
                    setAppData(importedData);
                    alert('Dados importados com sucesso!');
                } else {
                    throw new Error("O arquivo de backup parece ser inválido ou está corrompido.");
                }
            } catch (error) {
                console.error("Erro ao importar dados:", error);
                alert(`Não foi possível importar os dados. Erro: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                if(importInputRef.current) importInputRef.current.value = "";
            }
        };
        reader.onerror = () => {
             alert('Erro ao ler o arquivo.');
             if(importInputRef.current) importInputRef.current.value = "";
        }
        reader.readAsText(file);
    };


    const renderCell = (item: Item, columnKey: string) => {
        let value = (item as any)[columnKey];
        if (typeof value === 'boolean') {
            return value ? 'Sim' : 'Não';
        }
        if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
            return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        }
         if ((columnKey === 'totalValue' || columnKey === 'value') && typeof value === 'number') {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        }
        return value;
    };

    const renderModalFormFields = () => {
        switch (activeTable) {
            case 'clients':
                return (
                    <input name="name" value={(formData as Client).name || ''} onChange={handleFormChange} placeholder="Nome do Cliente" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3" />
                );
            case 'contracts':
                return (
                    <div className="space-y-4">
                        <select name="clientName" value={(formData as Contract).clientName || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white">
                            <option value="">Selecione um Cliente</option>
                            {appData.clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <input name="projectName" value={(formData as Contract).projectName || ''} onChange={handleFormChange} placeholder="Nome do Projeto" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                        <input name="totalValue" type="number" value={(formData as Contract).totalValue || ''} onChange={handleFormChange} placeholder="Valor Total" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                        <select name="status" value={(formData as Contract).status || 'Ativo'} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white">
                            <option>Ativo</option>
                            <option>Concluído</option>
                            <option>Cancelado</option>
                        </select>
                    </div>
                );
            case 'reminders':
                 return (
                    <div className="space-y-4">
                        <select name="clientName" value={(formData as Reminder).clientName || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white">
                            <option value="">Selecione um Cliente</option>
                            {appData.clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <input name="description" value={(formData as Reminder).description || ''} onChange={handleFormChange} placeholder="Descrição" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                        <input name="date" type="date" value={(formData as Reminder).date ? new Date((formData as Reminder).date).toISOString().split('T')[0] : ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                         <label className="flex items-center"><input name="completed" type="checkbox" checked={(formData as Reminder).completed || false} onChange={handleFormChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /> <span className="ml-2 text-sm">Concluído</span></label>
                    </div>
                 );
            default:
                return <p>Configuração de formulário não encontrada.</p>;
        }
    };


    return (
        <div className="space-y-8">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Banco de Dados</h1>
                <p className="mt-1 text-blue-100">
                    Gerencie os dados mestres da sua aplicação.
                </p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6">
                        {(Object.keys(tableConfig) as TableKey[]).map(key => (
                            <button
                                key={key}
                                onClick={() => setActiveTable(key)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                                    activeTable === key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                {tableConfig[key].title}
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        {selectedIds.size > 0 ? (
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors"
                            >
                                <TrashIcon className="w-5 h-5 mr-2" />
                                Excluir Selecionados ({selectedIds.size})
                            </button>
                        ) : (
                            <div />
                        )}
                        <button 
                            onClick={() => openModal()} 
                            disabled={activeTable === 'installments'}
                            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                            title={activeTable === 'installments' ? 'Parcelas são geradas a partir de contratos' : 'Adicionar Novo'}
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Adicionar Novo
                        </button>
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-3 w-4">
                                        <input 
                                            type="checkbox"
                                            checked={allVisibleItems.length > 0 && selectedIds.size === allVisibleItems.length}
                                            onChange={handleSelectAll}
                                            disabled={activeTable === 'installments'}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-slate-200 disabled:cursor-not-allowed"
                                        />
                                    </th>
                                    {tableConfig[activeTable].columns.map(col => (
                                        <th key={String(col.key)} className="p-3 text-sm font-semibold text-slate-600">{col.label}</th>
                                    ))}
                                    <th className="p-3 text-sm font-semibold text-slate-600 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(appData[activeTable] as Item[] || []).map(item => (
                                    <tr key={item.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                                        <td className="p-3 w-4">
                                            <input 
                                                type="checkbox"
                                                checked={selectedIds.has(item.id)}
                                                onChange={() => handleSelectItem(item.id)}
                                                disabled={activeTable === 'installments'}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-slate-200 disabled:cursor-not-allowed"
                                            />
                                        </td>
                                        {tableConfig[activeTable].columns.map(col => (
                                            <td key={String(col.key)} className="p-3 text-slate-700 text-sm">{renderCell(item, String(col.key))}</td>
                                        ))}
                                        <td className="p-3 text-right">
                                            <button 
                                                onClick={() => openModal(item)} 
                                                className="p-2 text-slate-500 hover:text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed" 
                                                aria-label="Editar"
                                                disabled={activeTable === 'installments'}
                                                title={activeTable === 'installments' ? 'Parcelas não podem ser editadas aqui' : 'Editar item'}
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)} 
                                                className="p-2 text-slate-500 hover:text-red-600 disabled:text-slate-300 disabled:cursor-not-allowed" 
                                                aria-label="Deletar"
                                                disabled={activeTable === 'installments'}
                                                title={activeTable === 'installments' ? 'Parcelas são excluídas com o contrato' : 'Deletar item'}
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                         {(appData[activeTable] as Item[] || []).length === 0 && (
                            <div className="text-center p-6 text-slate-500">
                                Nenhum item encontrado.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-semibold text-slate-800">Backup e Restauração de Dados</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Salve todos os seus dados em um arquivo seguro no seu computador. Você pode usar este arquivo para restaurar seus dados em outro dispositivo ou como um backup.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-4 border-t border-slate-200 pt-6">
                    <button
                        onClick={handleExportData}
                        className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Exportar Dados
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Importar Dados
                    </button>
                    <input
                        type="file"
                        ref={importInputRef}
                        onChange={handleImportData}
                        className="hidden"
                        accept=".json"
                    />
                </div>
            </div>


            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-500" aria-hidden="true" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-semibold text-red-800">Zona de Perigo</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>
                                A ação abaixo é destrutiva e irreversível. Tenha certeza do que está fazendo antes de prosseguir.
                            </p>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={onResetData}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
                                Limpar Banco de Dados
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">{editingItem ? 'Editar' : 'Adicionar'} {tableConfig[activeTable].title}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                            <div className="p-6 space-y-4">
                                {renderModalFormFields()}
                            </div>
                            <div className="flex justify-end space-x-4 p-4 bg-slate-50 rounded-b-lg">
                                <button type="button" onClick={closeModal} className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Database;