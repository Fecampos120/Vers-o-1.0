

import React, { useState, useMemo } from 'react';
import { Note, Contract } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, CheckCircleIcon, NotepadIcon } from './Icons';

interface NotesProps {
    notes: Note[];
    onUpdateNote: (note: Note) => void;
    onDeleteNote: (id: number) => void;
    onAddNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
    contracts: Contract[];
}

const Notes: React.FC<NotesProps> = ({ notes, onUpdateNote, onDeleteNote, onAddNote, contracts }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '', alertDate: '', contractId: '' });
    const [selectedFilterContract, setSelectedFilterContract] = useState<string>('');

    // Active contracts for dropdown
    const activeContracts = contracts.filter(c => c.status === 'Ativo');

    const handleEdit = (note: Note) => {
        setEditingNote(note);
        setFormData({ 
            title: note.title, 
            content: note.content, 
            alertDate: note.alertDate || '',
            contractId: note.contractId ? note.contractId.toString() : ''
        });
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir esta nota?')) {
            onDeleteNote(id);
        }
    };

    const handleToggleComplete = (note: Note) => {
        onUpdateNote({ ...note, completed: !note.completed });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const noteData = {
            title: formData.title,
            content: formData.content,
            alertDate: formData.alertDate,
            contractId: formData.contractId ? parseInt(formData.contractId) : undefined
        };

        if (editingNote) {
            onUpdateNote({ ...editingNote, ...noteData });
        } else {
            onAddNote({ ...noteData, completed: false });
        }
        setIsFormOpen(false);
        setEditingNote(null);
        setFormData({ title: '', content: '', alertDate: '', contractId: '' });
    };

    // Filter notes based on selected contract
    const filteredNotes = useMemo(() => {
        if (!selectedFilterContract) return notes;
        const contractId = parseInt(selectedFilterContract);
        return notes.filter(n => n.contractId === contractId);
    }, [notes, selectedFilterContract]);

    const pendingNotes = filteredNotes.filter(n => !n.completed).sort((a,b) => {
        // If sorting history for a client, prioritize createdAt/alertDate
        if(selectedFilterContract) {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        return (a.alertDate || '9999').localeCompare(b.alertDate || '9999');
    });

    const completedNotes = filteredNotes.filter(n => n.completed).sort((a,b) => (b.alertDate || '0000').localeCompare(a.alertDate || '0000'));
    
    // Auto-select contract in form if filter is active
    const handleOpenNewNote = () => {
        setEditingNote(null); 
        setFormData({ 
            title: '', 
            content: '', 
            alertDate: '',
            contractId: selectedFilterContract
        }); 
        setIsFormOpen(true);
    }

    return (
        <div className="space-y-8">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Bloco de Notas e Histórico</h1>
                <p className="mt-1 text-blue-100">
                    Registre ideias, tarefas rápidas e mantenha o histórico de anotações por cliente.
                </p>
            </header>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="w-full md:w-auto flex-1">
                    <label htmlFor="contract-filter" className="block text-sm font-medium text-slate-700 mb-1">Filtrar por Cliente/Projeto</label>
                    <div className="flex items-center space-x-2">
                        <select
                            id="contract-filter"
                            value={selectedFilterContract}
                            onChange={(e) => setSelectedFilterContract(e.target.value)}
                            className="block w-full max-w-md rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                        >
                            <option value="">Todas as Notas (Geral)</option>
                            {activeContracts.map(c => (
                                <option key={c.id} value={c.id}>{c.clientName} - {c.projectName}</option>
                            ))}
                        </select>
                         {selectedFilterContract && (
                            <button 
                                onClick={() => setSelectedFilterContract('')}
                                className="text-slate-400 hover:text-red-500 text-sm"
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                </div>

                {!isFormOpen && (
                    <button onClick={handleOpenNewNote} className="w-full md:w-auto px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {selectedFilterContract ? 'Nova Nota para Cliente' : 'Nova Nota'}
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">{editingNote ? 'Editar Nota' : 'Criar Nova Nota'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Vincular a Cliente (Opcional)</label>
                            <select
                                value={formData.contractId}
                                onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                                disabled={!!selectedFilterContract && !editingNote} // Lock if creating from filtered view
                            >
                                <option value="">Sem vínculo (Nota Geral)</option>
                                {activeContracts.map(c => (
                                    <option key={c.id} value={c.id}>{c.clientName} - {c.projectName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Título / Assunto</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Conteúdo</label>
                            <textarea rows={4} required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Data de Alerta (Opcional)</label>
                            <input type="date" value={formData.alertDate} onChange={e => setFormData({ ...formData, alertDate: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3" />
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* If Client Selected: Timeline View */}
            {selectedFilterContract ? (
                <div className="relative border-l-2 border-slate-200 ml-3 md:ml-6 pl-6 space-y-8">
                    {pendingNotes.length === 0 && completedNotes.length === 0 && (
                        <p className="text-slate-500 italic">Nenhum histórico de anotações para este cliente.</p>
                    )}
                    
                    {[...pendingNotes, ...completedNotes].map(note => (
                        <div key={note.id} className="relative group">
                            {/* Dot on timeline */}
                            <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-sm"></div>
                            
                            <div className={`bg-white p-5 rounded-lg shadow-sm border ${note.completed ? 'border-slate-200 bg-slate-50 opacity-75' : 'border-slate-200 hover:border-blue-300 transition-colors'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-xs font-semibold text-slate-400 uppercase">
                                                {new Date(note.createdAt || Date.now()).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'})}
                                            </span>
                                            {note.alertDate && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${new Date(note.alertDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    Alerta: {new Date(note.alertDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className={`font-bold text-lg ${note.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                            {note.title}
                                        </h3>
                                        <p className={`mt-2 whitespace-pre-wrap ${note.completed ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {note.content}
                                        </p>
                                    </div>
                                    <div className="flex flex-col space-y-2 ml-4">
                                        <button onClick={() => handleEdit(note)} className="p-1.5 text-slate-400 hover:text-blue-600" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(note.id)} className="p-1.5 text-slate-400 hover:text-red-600" title="Excluir"><TrashIcon className="w-4 h-4" /></button>
                                         <button onClick={() => handleToggleComplete(note)} className={`${note.completed ? 'text-green-600' : 'text-slate-300 hover:text-green-500'}`} title={note.completed ? "Reabrir" : "Concluir"}>
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Default Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>Pendentes</h2>
                        <div className="space-y-3">
                            {pendingNotes.length === 0 && <p className="text-slate-400 text-sm italic">Nenhuma nota pendente.</p>}
                            {pendingNotes.map(note => {
                                const linkedContract = contracts.find(c => c.id === note.contractId);
                                return (
                                    <div key={note.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 group relative">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                {linkedContract && (
                                                     <div className="mb-1">
                                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                                                            {linkedContract.clientName}
                                                        </span>
                                                    </div>
                                                )}
                                                <h3 className="font-bold text-slate-800">{note.title}</h3>
                                                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap line-clamp-3">{note.content}</p>
                                                {note.alertDate && (
                                                    <p className={`text-xs mt-2 font-medium ${new Date(note.alertDate) < new Date() ? 'text-red-500' : 'text-blue-500'}`}>
                                                        Alerta: {new Date(note.alertDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(note)} className="p-1.5 text-slate-400 hover:text-blue-600" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(note.id)} className="p-1.5 text-slate-400 hover:text-red-600" title="Excluir"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                        <button onClick={() => handleToggleComplete(note)} className="absolute bottom-3 right-3 text-slate-300 hover:text-green-500" title="Marcar como Concluído">
                                            <CheckCircleIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>Concluídas</h2>
                        <div className="space-y-3 opacity-75">
                             {completedNotes.length === 0 && <p className="text-slate-400 text-sm italic">Nenhuma nota concluída.</p>}
                            {completedNotes.map(note => {
                                const linkedContract = contracts.find(c => c.id === note.contractId);
                                return (
                                <div key={note.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-start">
                                    <div>
                                         {linkedContract && (
                                            <div className="mb-1">
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-500">
                                                    {linkedContract.clientName}
                                                </span>
                                            </div>
                                        )}
                                        <h3 className="font-bold text-slate-500 line-through">{note.title}</h3>
                                        <p className="text-sm text-slate-400 mt-1 line-through truncate">{note.content}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                         <button onClick={() => handleToggleComplete(note)} className="text-green-500 hover:text-green-700" title="Reabrir">
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(note.id)} className="text-slate-300 hover:text-red-600" title="Excluir">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default Notes;