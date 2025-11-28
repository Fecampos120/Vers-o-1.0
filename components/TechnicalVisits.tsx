

import React, { useState } from 'react';
import { Contract, VisitLog } from '../types';
import { MapPinIcon, PlusIcon, CheckCircleIcon } from './Icons';

interface TechnicalVisitsProps {
    contracts: Contract[];
    visitLogs: VisitLog[];
    onAddVisitLog: (log: Omit<VisitLog, 'id' | 'createdAt'>) => void;
}

const TechnicalVisits: React.FC<TechnicalVisitsProps> = ({ contracts, visitLogs, onAddVisitLog }) => {
    // Filter only contracts that have tech visits enabled
    const eligibleContracts = contracts.filter(c => c.status === 'Ativo' && c.techVisits?.enabled);
    
    const [selectedContractId, setSelectedContractId] = useState<string>('');
    const [newVisitDate, setNewVisitDate] = useState(new Date().toISOString().split('T')[0]);
    const [newVisitNotes, setNewVisitNotes] = useState('');

    const selectedContract = eligibleContracts.find(c => c.id.toString() === selectedContractId);
    
    // Calculate stats for selected contract
    const contractLogs = selectedContract 
        ? visitLogs.filter(l => l.contractId === selectedContract.id).sort((a,b) => b.date.localeCompare(a.date))
        : [];
    
    const totalVisits = selectedContract?.techVisits?.quantity || 0;
    const visitsDone = contractLogs.length;
    const visitsRemaining = Math.max(0, totalVisits - visitsDone);
    const progress = totalVisits > 0 ? (visitsDone / totalVisits) * 100 : 0;

    const handleAddVisit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContract) return;

        onAddVisitLog({
            contractId: selectedContract.id,
            date: newVisitDate,
            notes: newVisitNotes
        });

        setNewVisitNotes('');
        alert('Visita registrada com sucesso!');
    };

    return (
        <div className="space-y-8">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Visitas Técnicas in loco</h1>
                <p className="mt-1 text-blue-100">
                    Controle o saldo de visitas contratuais e registre as atas de cada ida à obra.
                </p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <label className="block text-sm font-medium text-slate-700 mb-2">Selecione o Projeto/Contrato</label>
                <select 
                    value={selectedContractId} 
                    onChange={e => setSelectedContractId(e.target.value)} 
                    className="block w-full max-w-md rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                >
                    <option value="">Selecione...</option>
                    {eligibleContracts.map(c => (
                        <option key={c.id} value={c.id}>{c.projectName} - {c.clientName}</option>
                    ))}
                    {eligibleContracts.length === 0 && <option disabled>Nenhum contrato com visitas habilitadas.</option>}
                </select>
            </div>

            {selectedContract && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Resumo e Progresso */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                <MapPinIcon className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">{visitsDone} / {totalVisits}</h2>
                            <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold mt-1">Visitas Realizadas</p>
                            
                            <div className="mt-6 w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                                <div className="bg-blue-600 h-4 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                                {visitsRemaining} visitas restantes no contrato.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Registrar Nova Visita</h3>
                            <form onSubmit={handleAddVisit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Data da Visita</label>
                                    <input type="date" required value={newVisitDate} onChange={e => setNewVisitDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Ata / Observações</label>
                                    <textarea required rows={4} value={newVisitNotes} onChange={e => setNewVisitNotes(e.target.value)} placeholder="Descreva o que foi verificado..." className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3" />
                                </div>
                                <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 shadow-sm transition-colors flex justify-center items-center">
                                    <CheckCircleIcon className="w-5 h-5 mr-2" /> Confirmar Visita
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Histórico */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center">
                            <span className="w-2 h-6 bg-blue-600 mr-3 rounded-full"></span>
                            Histórico de Visitas
                        </h3>
                        
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {contractLogs.length === 0 && (
                                <p className="text-center text-slate-500 py-10 italic bg-white relative z-10">Nenhuma visita registrada ainda.</p>
                            )}
                            
                            {contractLogs.map((log) => (
                                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                                        <MapPinIcon className="w-5 h-5" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <time className="font-bold text-slate-800 text-sm">
                                                {new Date(log.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                            </time>
                                        </div>
                                        <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                                            {log.notes}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechnicalVisits;