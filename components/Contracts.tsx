
import React, { useState, useMemo } from 'react';
import { Contract, ProjectSchedule, Client, ProjectStage } from '../types';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, ArchitectIcon, PrinterIcon, XIcon } from './Icons';

// This is the new main component for this file, implementing the "Projetos" view.
interface DisplayProject {
    id: number;
    projectName: string;
    clientName: string;
    clientLogoUrl?: string;
    progress: number;
    startDate: Date;
    endDate: Date;
    status: 'Em Andamento' | 'Atrasado' | 'Concluído' | 'Cancelado' | 'No Prazo';
    isArchived: boolean;
    originalContract: Contract;
}

interface ProjectsProps {
    contracts: Contract[];
    schedules: ProjectSchedule[];
    clients: Client[];
    onEditContract: (contract: Contract) => void;
    onDeleteContract: (id: number) => void;
    onCreateProject: () => void;
}

const StatusChip: React.FC<{ status: DisplayProject['status'] }> = ({ status }) => {
    const styles = {
        'Em Andamento': 'bg-yellow-100 text-yellow-800',
        'Atrasado': 'bg-red-100 text-red-800',
        'Concluído': 'bg-green-100 text-green-800',
        'Cancelado': 'bg-slate-100 text-slate-800',
        'No Prazo': 'bg-blue-100 text-blue-800',
    };
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status] || styles['Cancelado']}`}>
            {status}
        </span>
    );
};

interface ProjectReportModalProps {
    contract: Contract;
    schedule?: ProjectSchedule;
    onClose: () => void;
}

const ProjectReportModal: React.FC<ProjectReportModalProps> = ({ contract, schedule, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    const formatDate = (date: string | Date | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const calculateProgress = () => {
        if (!schedule || schedule.stages.length === 0) return 0;
        const completed = schedule.stages.filter(s => s.completionDate).length;
        return Math.round((completed / schedule.stages.length) * 100);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 print:p-0 print:bg-white">
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    .project-report-modal, .project-report-modal * { display: block !important; }
                    .project-report-modal { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        height: auto; 
                        background: white;
                        overflow: visible !important;
                    }
                    .no-print { display: none !important; }
                    @page { margin: 1.5cm; }
                }
            `}</style>
            
            <div className="project-report-modal bg-white w-full max-w-4xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:rounded-none">
                <div className="p-4 border-b flex justify-between items-center no-print">
                    <h3 className="font-bold text-lg">Relatório do Projeto</h3>
                    <div className="flex space-x-2">
                        <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            <PrinterIcon className="w-4 h-4 mr-2"/> Imprimir
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded">
                            <XIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                <div className="p-8 font-serif text-slate-900">
                    {/* Header */}
                    <header className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-wider">Relatório de Status do Projeto</h1>
                            <p className="text-slate-600 text-sm mt-1">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end space-x-2 font-bold text-xl">
                                <ArchitectIcon className="w-6 h-6" />
                                <span>STUDIO BATTELLO</span>
                            </div>
                            <p className="text-xs text-slate-500">Arquitetura & Interiores</p>
                        </div>
                    </header>

                    <main className="space-y-8">
                        {/* Project Info Grid */}
                        <section className="grid grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 print:border-slate-300">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Dados do Projeto</h3>
                                <div className="space-y-1">
                                    <p><span className="font-semibold">Projeto:</span> {contract.projectName}</p>
                                    <p><span className="font-semibold">Cliente:</span> {contract.clientName}</p>
                                    <p><span className="font-semibold">Endereço:</span> {contract.projectAddress.street}, {contract.projectAddress.number} - {contract.projectAddress.city}</p>
                                    <p><span className="font-semibold">Tipo:</span> {contract.serviceType}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 print:border-slate-300">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Resumo do Contrato</h3>
                                <div className="space-y-1">
                                    <p><span className="font-semibold">Início (Assinatura):</span> {formatDate(contract.date)}</p>
                                    <p><span className="font-semibold">Previsão Entrega:</span> {formatDate(schedule?.stages[schedule.stages.length-1]?.deadline)}</p>
                                    <p><span className="font-semibold">Progresso Geral:</span> {calculateProgress()}%</p>
                                    <p><span className="font-semibold">Status Atual:</span> {contract.status}</p>
                                </div>
                            </div>
                        </section>

                        {/* Schedule Details */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">Cronograma Detalhado e Prazos</h3>
                            {schedule ? (
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                                            <th className="py-2 px-3 text-left">Etapa</th>
                                            <th className="py-2 px-3 text-center">Prazo Final</th>
                                            <th className="py-2 px-3 text-center">Conclusão</th>
                                            <th className="py-2 px-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {schedule.stages.map((stage) => {
                                            const isCompleted = !!stage.completionDate;
                                            const isLate = !isCompleted && stage.deadline && new Date(stage.deadline) < new Date();
                                            return (
                                                <tr key={stage.id}>
                                                    <td className="py-2 px-3 font-medium">{stage.name}</td>
                                                    <td className="py-2 px-3 text-center">{formatDate(stage.deadline)}</td>
                                                    <td className="py-2 px-3 text-center">{stage.completionDate ? formatDate(stage.completionDate) : '-'}</td>
                                                    <td className="py-2 px-3 text-center">
                                                        {isCompleted ? (
                                                            <span className="text-green-600 font-bold text-xs uppercase">Concluído</span>
                                                        ) : isLate ? (
                                                            <span className="text-red-600 font-bold text-xs uppercase">Atrasado</span>
                                                        ) : (
                                                            <span className="text-slate-500 text-xs uppercase">Pendente</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-slate-500 italic">Nenhum cronograma disponível.</p>
                            )}
                        </section>

                        {/* Financial Summary (Optional - kept brief) */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">Resumo Financeiro</h3>
                            <div className="flex justify-between text-sm max-w-md">
                                <span>Valor Total Contratado:</span>
                                <span className="font-bold">{formatCurrency(contract.totalValue)}</span>
                            </div>
                            <div className="flex justify-between text-sm max-w-md mt-1">
                                <span>Parcelas:</span>
                                <span>{contract.installments > 0 ? `${contract.installments}x de ${formatCurrency(contract.installmentValue)}` : 'À Vista / Entrada Única'}</span>
                            </div>
                        </section>
                    </main>
                    
                    <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
                        <p>Relatório gerado automaticamente pelo sistema E-Projet.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};


const Projects: React.FC<ProjectsProps> = ({ contracts, schedules, clients, onEditContract, onDeleteContract, onCreateProject }) => {
    const [activeTab, setActiveTab] = useState<'ativos' | 'arquivados'>('ativos');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [reportProject, setReportProject] = useState<{ contract: Contract, schedule?: ProjectSchedule } | null>(null);
    const projectsPerPage = 8;
    
    const displayProjects = useMemo((): DisplayProject[] => {
        return contracts.map(contract => {
            const schedule = schedules.find(s => s.contractId === contract.id);
            const client = clients.find(c => c.name === contract.clientName);

            let progress = 0;
            let endDate: Date = new Date(contract.date);
            let status: DisplayProject['status'] = 'No Prazo';
            const isArchived = contract.status === 'Concluído' || contract.status === 'Cancelado';

            if (schedule) {
                const totalStages = schedule.stages.length;
                const completedStages = schedule.stages.filter(s => s.completionDate).length;
                progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
                
                if (schedule.stages.length > 0) {
                     const lastStage = schedule.stages[schedule.stages.length - 1];
                     if(lastStage.deadline) {
                        endDate = new Date(`${lastStage.deadline}T00:00:00`);
                     }
                }

                if (contract.status === 'Ativo') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isDelayed = schedule.stages.some(stage => !stage.completionDate && stage.deadline && new Date(`${stage.deadline}T00:00:00`) < today);
                    if (isDelayed) {
                        status = 'Atrasado';
                    } else {
                        status = 'Em Andamento';
                    }
                }
            }

            if (isArchived) {
                status = contract.status as 'Concluído' | 'Cancelado';
                if (status === 'Concluído') progress = 100;
            }
            
            return {
                id: contract.id,
                projectName: contract.projectName,
                clientName: contract.clientName,
                clientLogoUrl: client?.logoUrl,
                progress,
                startDate: new Date(contract.date),
                endDate,
                status,
                isArchived,
                originalContract: contract,
            };
        }).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    }, [contracts, schedules, clients]);

    const filteredProjects = useMemo(() => {
        return displayProjects
            .filter(p => (activeTab === 'ativos' ? !p.isArchived : p.isArchived))
            .filter(p => 
                p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [displayProjects, activeTab, searchTerm]);
    
    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
    const paginatedProjects = filteredProjects.slice((currentPage - 1) * projectsPerPage, currentPage * projectsPerPage);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleOpenReport = (contract: Contract) => {
        const schedule = schedules.find(s => s.contractId === contract.id);
        setReportProject({ contract, schedule });
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Projetos</h1>
                <button 
                    onClick={onCreateProject}
                    className="flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                   <PlusIcon className="w-5 h-5 mr-2" />
                   <span>CRIAR PROJETO</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
                <div>
                    <div className="border-b border-slate-200">
                        <nav className="-mb-px flex space-x-6">
                            <button
                                onClick={() => { setActiveTab('ativos'); setCurrentPage(1); }}
                                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                                    activeTab === 'ativos'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Ativos
                            </button>
                            <button
                                onClick={() => { setActiveTab('arquivados'); setCurrentPage(1); }}
                                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                                    activeTab === 'arquivados'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Arquivados
                            </button>
                        </nav>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <p className="text-sm text-slate-600 font-medium w-full sm:w-auto text-center sm:text-left">
                        {filteredProjects.length} Resultados encontrados
                    </p>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input
                                type="text"
                                placeholder="Pesquisar projeto"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10 pr-4 py-2 w-64 bg-white rounded-lg border border-slate-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1024px]">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="p-3 text-sm font-semibold text-slate-500">PROJETO</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">CLIENTE</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">PROGRESSO</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">ASSINATURA</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">VENC. ENTRADA</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">DATA DE ENTREGA</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">STATUS</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProjects.map(project => (
                                <tr key={project.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                                    <td className="p-3 font-semibold text-slate-800">{project.projectName}</td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-3">
                                            {project.clientLogoUrl ? 
                                                <img src={project.clientLogoUrl} alt={project.clientName} className="w-7 h-7 rounded-full object-contain bg-white"/> :
                                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{project.clientName.charAt(0)}</div>
                                            }
                                            <span className="text-sm text-slate-700 font-medium">{project.clientName}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${project.progress}%`}}></div>
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 w-10 text-right">{project.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-slate-600">{project.originalContract.date ? new Date(project.originalContract.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</td>
                                    <td className="p-3 text-sm text-slate-600">{project.originalContract.downPaymentDate ? new Date(project.originalContract.downPaymentDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</td>
                                    <td className="p-3 text-sm text-slate-600">{project.endDate.toLocaleDateString('pt-BR')}</td>
                                    <td className="p-3"><StatusChip status={project.status} /></td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end space-x-1">
                                            <button onClick={() => handleOpenReport(project.originalContract)} className="p-2 text-slate-500 hover:text-purple-600" aria-label="Imprimir Relatório" title="Imprimir Relatório"><PrinterIcon className="w-5 h-5" /></button>
                                            <button onClick={() => onEditContract(project.originalContract)} className="p-2 text-slate-500 hover:text-blue-600" aria-label="Editar" title="Editar"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => onDeleteContract(project.id)} className="p-2 text-slate-500 hover:text-red-600" aria-label="Excluir" title="Excluir"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {paginatedProjects.length === 0 && (
                        <div className="text-center py-10 text-slate-500">Nenhum projeto encontrado.</div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 pt-4">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full disabled:opacity-50 text-slate-600 hover:bg-slate-100">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                    currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-full disabled:opacity-50 text-slate-600 hover:bg-slate-100">
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {reportProject && (
                <ProjectReportModal 
                    contract={reportProject.contract}
                    schedule={reportProject.schedule}
                    onClose={() => setReportProject(null)}
                />
            )}
        </div>
    );
};

export default Projects;
