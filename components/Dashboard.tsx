

import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from './StatCard';
import {
  DownloadIcon,
  MoneyBagIcon,
  DollarIcon,
  ChartBarIcon,
  DocumentIcon,
  SendIcon,
  NotepadIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from './Icons';
import { PaymentInstallment, AttentionPoint, Contract, ProjectProgress, OtherPayment, ProjectSchedule, Note } from '../types';
import PaymentReminderModal from './PaymentReminderModal';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: Date) => {
    if (!date) return '';
     const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {timeZone: 'UTC'}).format(d);
}

const ProjectStatusChart: React.FC<{ contracts: Contract[], schedules: ProjectSchedule[] }> = ({ contracts, schedules }) => {
    const projectStatusData = useMemo(() => {
        const statuses = {
            'No Prazo': 0,
            'Em Andamento': 0,
            'Atrasado': 0,
        };

        const activeContracts = contracts.filter(c => c.status === 'Ativo');

        activeContracts.forEach(contract => {
            const schedule = schedules.find(s => s.contractId === contract.id);
            let status: 'No Prazo' | 'Em Andamento' | 'Atrasado' = 'No Prazo';
            
            if (schedule) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const isDelayed = schedule.stages.some(stage => {
                    if (!stage.completionDate && stage.deadline) {
                        const deadline = new Date(`${stage.deadline}T00:00:00`);
                        return deadline < today;
                    }
                    return false;
                });

                if (isDelayed) {
                    status = 'Atrasado';
                } else {
                    const hasCompletedStages = schedule.stages.some(stage => !!stage.completionDate);
                    const projectStartDate = schedule.startDate ? new Date(`${schedule.startDate}T00:00:00`) : today;
                    const hasStarted = projectStartDate <= today;

                    if (hasStarted || hasCompletedStages) {
                        status = 'Em Andamento';
                    } else {
                        status = 'No Prazo';
                    }
                }
            }
            statuses[status]++;
        });

        return [
            { name: 'Atrasado', value: statuses['Atrasado'], color: '#ef4444' }, // red-500
            { name: 'Em Andamento', value: statuses['Em Andamento'], color: '#facc15' }, // yellow-400
            { name: 'No Prazo', value: statuses['No Prazo'], color: '#22c55e' }, // green-500
        ];
    }, [contracts, schedules]);
    
    const totalProjects = projectStatusData.reduce((sum, entry) => sum + entry.value, 0);

    return (
        <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                    >
                        {projectStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Legend
                        iconSize={10}
                        iconType="circle"
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        formatter={(value, entry) => (
                            <span className="text-slate-600 ml-2">{`${value} (${entry.payload?.value})`}</span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <p className="text-4xl font-bold text-slate-800">{totalProjects}</p>
                    <p className="text-sm text-slate-500">Ativos</p>
                </div>
            </div>
        </div>
    );
};


const PaymentRegistration: React.FC<{
    installments: PaymentInstallment[];
    onRegisterInstallment: (installmentId: number, paymentDate: Date) => void;
    onRegisterOther: (description: string, paymentDate: Date, value: number) => void;
}> = ({ installments, onRegisterInstallment, onRegisterOther }) => {
    const [activeTab, setActiveTab] = useState<'installment' | 'other'>('installment');

    // States for installment form
    const [selectedInstallmentId, setSelectedInstallmentId] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    
    // States for other payment form
    const [otherDesc, setOtherDesc] = useState('');
    const [otherDate, setOtherDate] = useState(new Date().toISOString().split('T')[0]);
    const [otherValue, setOtherValue] = useState('');

    const pendingInstallments = installments
        .filter(i => i.status === 'Pendente')
        .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const handleInstallmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedInstallmentId || !paymentDate) {
            alert("Por favor, selecione uma parcela e a data de pagamento.");
            return;
        }
        onRegisterInstallment(parseInt(selectedInstallmentId), new Date(`${paymentDate}T00:00:00`));
        setSelectedInstallmentId('');
    };

    const handleOtherSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valueNum = parseFloat(otherValue);
        if (!otherDesc || !otherDate || isNaN(valueNum) || valueNum <= 0) {
            alert("Por favor, preencha todos os campos com valores válidos.");
            return;
        }
        onRegisterOther(otherDesc, new Date(`${otherDate}T00:00:00`), valueNum);
        setOtherDesc('');
        setOtherValue('');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('installment')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'installment'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        Registrar Parcela
                    </button>
                    <button
                        onClick={() => setActiveTab('other')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'other'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        Registrar Outros
                    </button>
                </nav>
            </div>
            
            {activeTab === 'installment' && (
                <form onSubmit={handleInstallmentSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="installment-select" className="block text-sm font-medium text-slate-600">Parcela Pendente</label>
                        <select id="installment-select" value={selectedInstallmentId} onChange={e => setSelectedInstallmentId(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3">
                            <option value="">Selecione uma parcela...</option>
                            {pendingInstallments.map(i => (
                                <option key={i.id} value={i.id}>
                                    {`${i.clientName} (${i.projectName}) - ${i.installment} de ${formatCurrency(i.value)} - Vence em ${formatDate(new Date(i.dueDate))}`}
                                </option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="payment-date" className="block text-sm font-medium text-slate-600">Data do Pagamento</label>
                        <input type="date" id="payment-date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                    <div className="md:col-span-3">
                        <button type="submit" className="w-full md:w-auto justify-center rounded-md border border-transparent bg-blue-600 py-2 px-8 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Registrar Pagamento de Parcela
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'other' && (
                <form onSubmit={handleOtherSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                     <div className="md:col-span-2">
                        <label htmlFor="other-desc" className="block text-sm font-medium text-slate-600">Descrição</label>
                        <input type="text" id="other-desc" value={otherDesc} onChange={e => setOtherDesc(e.target.value)} required placeholder="Ex: Consultoria extra" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                     <div>
                        <label htmlFor="other-date" className="block text-sm font-medium text-slate-600">Data do Pagamento</label>
                        <input type="date" id="other-date" value={otherDate} onChange={e => setOtherDate(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                     <div>
                        <label htmlFor="other-value" className="block text-sm font-medium text-slate-600">Valor (R$)</label>
                        <input type="number" id="other-value" value={otherValue} onChange={e => setOtherValue(e.target.value)} required placeholder="0.00" step="0.01" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                    <div className="md:col-span-4">
                        <button type="submit" className="w-full md:w-auto justify-center rounded-md border border-transparent bg-green-600 py-2 px-8 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                            Adicionar Recebimento
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

interface DashboardProps {
    installments: PaymentInstallment[];
    setInstallments: (installments: PaymentInstallment[]) => void;
    contracts: Contract[];
    schedules: ProjectSchedule[];
    projectProgress: ProjectProgress[];
    otherPayments: OtherPayment[];
    onAddOtherPayment: (newPayment: Omit<OtherPayment, 'id'>) => void;
    notes: Note[];
    onUpdateNote: (note: Note) => void;
    onEditNoteClick: (note: Note) => void; 
}


const Dashboard: React.FC<DashboardProps> = ({ installments, setInstallments, contracts, schedules, projectProgress, otherPayments, onAddOtherPayment, notes, onUpdateNote, onEditNoteClick }) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);
    const [selectedClientFilter, setSelectedClientFilter] = useState('');

    const handleOpenReminderModal = (installment: PaymentInstallment) => {
        setSelectedInstallment(installment);
        setIsReminderModalOpen(true);
    };

    const handleCloseReminderModal = () => {
        setSelectedInstallment(null);
        setIsReminderModalOpen(false);
    };
    
    // Notes Logic for Dashboard
    const pendingNotes = useMemo(() => {
        return (notes || []).filter(n => !n.completed).sort((a,b) => {
            if (a.alertDate && b.alertDate) return a.alertDate.localeCompare(b.alertDate);
            if (a.alertDate) return -1;
            if (b.alertDate) return 1;
            return 0;
        });
    }, [notes]);
    
    const attentionPoints: AttentionPoint[] = useMemo(() => {
        const points: AttentionPoint[] = [];
        
        // Upcoming Stage Deadlines (next 7 days)
        schedules.forEach(schedule => {
            const contractIsActive = contracts.some(c => c.id === schedule.contractId && c.status === 'Ativo');
            if (!contractIsActive) return;

            const nextStage = schedule.stages.find(s => !s.completionDate);
            if (nextStage && nextStage.deadline) {
                const deadline = new Date(nextStage.deadline);
                deadline.setHours(0,0,0,0);
                if (deadline >= today) {
                    const diffTime = deadline.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= 7) {
                        points.push({
                            clientName: schedule.clientName,
                            description: `Etapa "${nextStage.name}" vence em ${diffDays} dia(s).`,
                            daysRemaining: diffDays,
                            type: 'stage',
                        });
                    }
                }
            }
        });

        return points.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [schedules, contracts]);

    const financialAttentionPoints: AttentionPoint[] = useMemo(() => {
        const points: AttentionPoint[] = [];
        
        installments.forEach(inst => {
            if (inst.status === 'Pendente') {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0,0,0,0);
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Overdue
                if (diffDays < 0) {
                     points.push({
                        clientName: inst.clientName,
                        description: `Parcela ${inst.installment} (${formatCurrency(inst.value)}) vencida.`,
                        daysRemaining: diffDays,
                        type: 'payment',
                    });
                } 
                // Upcoming (next 7 days)
                else if (diffDays <= 7) {
                    points.push({
                        clientName: inst.clientName,
                        description: `Parcela ${inst.installment} (${formatCurrency(inst.value)}) vence em ${diffDays} dia(s).`,
                        daysRemaining: diffDays,
                        type: 'payment',
                    });
                }
            }
        });

        return points.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [installments]);
    
    const { receivedThisMonth, expectedThisMonth, totalOverdue } = useMemo(() => {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        let receivedThisMonth = 0;
        let expectedThisMonth = 0;
        let totalOverdue = 0;

        installments.forEach(i => {
            // Recebido no Mês
            if(i.paymentDate) {
                const paymentDate = new Date(i.paymentDate);
                const paymentYear = paymentDate.getFullYear();
                if(paymentYear === currentYear && paymentDate.getMonth() === currentMonth) {
                    receivedThisMonth += i.value;
                }
            }
            
            // Previsto/Pendente no Mês
            const dueDate = new Date(i.dueDate);
            if (i.status === 'Pendente') {
                if (dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth) {
                    expectedThisMonth += i.value;
                }
                // Total Atrasado
                const dDate = new Date(i.dueDate);
                dDate.setHours(0,0,0,0);
                if (dDate < today) {
                    totalOverdue += i.value;
                }
            }
        });
        
        otherPayments.forEach(op => {
            const paymentDate = new Date(op.paymentDate);
            const paymentYear = paymentDate.getFullYear();
            if(paymentYear === currentYear && paymentDate.getMonth() === currentMonth) {
                receivedThisMonth += op.value;
            }
        });


        return { receivedThisMonth, expectedThisMonth, totalOverdue };
    }, [installments, otherPayments]);
    
    const handleRegisterPayment = (installmentId: number, paymentDate: Date) => {
        setInstallments(
            installments.map(inst => {
                if (inst.id === installmentId) {
                    const dueDate = new Date(inst.dueDate);
                    dueDate.setHours(0,0,0,0);
                    paymentDate.setHours(0,0,0,0);
                    const status = paymentDate <= dueDate ? 'Pago em dia' : 'Pago com atraso';
                    return { ...inst, status, paymentDate: paymentDate };
                }
                return inst;
            })
        );
    };

    const handleAddOtherPayment = (description: string, paymentDate: Date, value: number) => {
        onAddOtherPayment({ description, paymentDate, value });
    };

    
    const getStatusChip = (status: PaymentInstallment['status']) => {
        switch (status) {
            case 'Pendente': return 'bg-amber-100 text-amber-800';
            case 'Pago em dia': return 'bg-green-100 text-green-800';
            case 'Pago com atraso': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };
    
    const upcomingInstallments = installments
        .filter(i => i.status === 'Pendente' && new Date(i.dueDate) >= today)
        .filter(i => selectedClientFilter ? i.clientName === selectedClientFilter : true)
        .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
    const uniqueClients = useMemo(() => {
        const clients = new Set(installments.map(i => i.clientName));
        return Array.from(clients).sort();
    }, [installments]);


  return (
    <div className="space-y-8">
      <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <h1 className="text-3xl font-bold">Painel de Controle E-Projet</h1>
                <p className="mt-1 text-blue-100">
                    Visão geral dos seus projetos e recebimentos
                </p>
            </div>
            <button className="mt-4 sm:mt-0 flex items-center justify-center px-4 py-2 bg-white/20 border border-white/30 text-white rounded-lg shadow-sm hover:bg-white/30 transition-colors">
                <DownloadIcon className="w-5 h-5 mr-2" />
                Exportar Excel
            </button>
        </div>
      </header>
      
      <section>
          <PaymentRegistration 
            installments={installments} 
            onRegisterInstallment={handleRegisterPayment}
            onRegisterOther={handleAddOtherPayment}
            />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Previsto (Mês Atual)"
          value={formatCurrency(expectedThisMonth)}
          icon={<DollarIcon className="w-6 h-6 text-blue-500" />}
        />
        <StatCard
          title="Recebido (Mês Atual)"
          value={formatCurrency(receivedThisMonth)}
          icon={<MoneyBagIcon className="w-6 h-6 text-green-500" />}
        />
        <StatCard
          title="Total Atrasado"
          value={formatCurrency(totalOverdue)}
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-500" />}
        />
        <StatCard
          title="Contratos Ativos"
          value={contracts.filter(c => c.status === 'Ativo').length.toString()}
          icon={<DocumentIcon className="w-6 h-6 text-purple-500" />}
        />
      </section>

      {/* Alertas e Notas Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget de Notas e Alertas */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
             <h2 className="text-lg font-semibold text-slate-800 flex items-center mb-4">
                <NotepadIcon className="w-5 h-5 mr-2 text-blue-600" />
                Anotações
            </h2>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
                {pendingNotes.length === 0 && <p className="text-sm text-slate-500 italic">Nenhuma anotação pendente.</p>}
                {pendingNotes.map((note) => (
                    <li key={note.id} className="flex items-center justify-between p-2 bg-slate-50 hover:bg-blue-50 rounded-md group relative">
                        {/* Tooltip on Hover */}
                        <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                            <p className="font-bold border-b border-slate-600 pb-1 mb-1">{note.title}</p>
                            <p>{note.content}</p>
                            <div className="absolute left-4 -bottom-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                        </div>

                        <div 
                            onClick={() => onEditNoteClick(note)} 
                            className="flex-1 cursor-pointer truncate"
                        >
                            <span className="font-medium text-slate-700">{note.title}</span>
                            {note.alertDate && (
                                <span className={`ml-2 text-xs font-bold ${new Date(note.alertDate) < new Date() ? 'text-red-500' : 'text-blue-500'}`}>
                                    {new Date(note.alertDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                </span>
                            )}
                        </div>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUpdateNote({...note, completed: true}); }}
                            className="text-slate-300 hover:text-green-500 ml-2"
                            title="Concluir"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-slate-800">Prazos de Etapas</h2>
          <ul className="mt-4 space-y-4 max-h-64 overflow-y-auto">
            {attentionPoints.length > 0 ? attentionPoints.map((point: AttentionPoint, index: number) => {
              const iconColor = 'bg-orange-500'; // For stages
              return (
              <li key={index} className="flex items-start">
                <div className={`w-2.5 h-2.5 ${iconColor} rounded-full mt-1.5 mr-4 flex-shrink-0`}></div>
                <div>
                  <p className="font-semibold text-slate-700">{point.clientName}</p>
                  <p className="text-sm text-slate-500">{point.description}</p>
                </div>
              </li>
              )
            }) : <p className="text-sm text-slate-500">Nenhum prazo próximo nos próximos 7 dias.</p>}
          </ul>
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-slate-800">Atenção Financeira</h2>
          <ul className="mt-4 space-y-4 max-h-64 overflow-y-auto">
            {financialAttentionPoints.length > 0 ? financialAttentionPoints.map((point: AttentionPoint, index: number) => {
              const iconColor = point.daysRemaining < 0 ? 'bg-red-500' : 'bg-amber-500';
              return (
              <li key={index} className="flex items-start">
                <div className={`w-2.5 h-2.5 ${iconColor} rounded-full mt-1.5 mr-4 flex-shrink-0`}></div>
                <div>
                  <p className="font-semibold text-slate-700">{point.clientName}</p>
                  <p className="text-sm text-slate-500">{point.description}</p>
                </div>
              </li>
              )
            }) : <p className="text-sm text-slate-500">Nenhum pagamento atrasado ou vencendo nos próximos 7 dias.</p>}
          </ul>
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Próximas Parcelas a Receber</h2>
            <select 
                value={selectedClientFilter} 
                onChange={e => setSelectedClientFilter(e.target.value)}
                className="block rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2"
            >
                <option value="">Todos os Clientes</option>
                {uniqueClients.map(client => (
                    <option key={client} value={client}>{client}</option>
                ))}
            </select>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="p-3 text-sm font-semibold text-slate-500">Cliente</th>
                <th className="p-3 text-sm font-semibold text-slate-500">Parcela</th>
                <th className="p-3 text-sm font-semibold text-slate-500">Vencimento</th>
                <th className="p-3 text-sm font-semibold text-slate-500">Valor</th>
                <th className="p-3 text-sm font-semibold text-slate-500">Status</th>
                <th className="p-3 text-sm font-semibold text-slate-500 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {upcomingInstallments.map((payment: PaymentInstallment) => (
                <tr key={payment.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="p-3 text-slate-700">{payment.clientName}</td>
                  <td className="p-3 text-slate-700">{payment.installment}</td>
                  <td className="p-3 text-slate-700">{formatDate(new Date(payment.dueDate))}</td>
                  <td className="p-3 text-slate-700">{formatCurrency(payment.value)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChip(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleOpenReminderModal(payment)}
                      className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
                      aria-label="Enviar Lembrete"
                      title="Enviar Lembrete"
                    >
                      <SendIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
               {upcomingInstallments.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center p-4 text-slate-500">Nenhuma parcela pendente {selectedClientFilter ? 'para este cliente' : ''}.</td>
                </tr>
               )}
            </tbody>
          </table>
        </div>
      </section>
      
      <PaymentReminderModal 
        isOpen={isReminderModalOpen}
        onClose={handleCloseReminderModal}
        installment={selectedInstallment}
      />
    </div>
  );
};

export default Dashboard;