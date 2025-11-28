
import React, { useState, useMemo, useEffect } from 'react';
import { 
  DashboardIcon, 
  BellIcon, 
  FileTextIcon, 
  PlusIcon, 
  TrendingUpIcon, 
  CogIcon,
  WalletIcon,
  ReceiptIcon,
  CashIcon,
  DatabaseIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ClipboardCheckIcon,
  NotepadIcon,
  MapPinIcon
} from './components/Icons';
import Dashboard from './components/Dashboard';
import Reminders from './components/Reminders';
import Contracts from './components/Contracts';
import NewContract from './components/NewContract';
import Progress from './components/Progress';
import Settings from './components/Settings';
import Receipts from './components/Receipts';
import Projections from './components/Projections';
import LatePayments from './components/LatePayments';
import MonthlyRevenueChart from './components/MonthlyRevenueChart';
import Database from './components/Database';
import Partners from './components/Partners';
import ConstructionChecklist from './components/ConstructionChecklist';
import Notes from './components/Notes';
import TechnicalVisits from './components/TechnicalVisits';

import { AppData, PaymentInstallment, Contract, OtherPayment, Client, Partner, ProjectStageTemplateItem, ProjectSchedule, ProjectStage, ProjectProgress, StageProgress, ProjectChecklist, Note, VisitLog } from './types';
import { CLIENTS, MOCK_CONTRACTS, MOCK_REMINDERS, INITIAL_INSTALLMENTS, MOCK_PROJECT_SCHEDULES, MOCK_PROJECT_PROGRESS, MOCK_SERVICE_PRICES, MOCK_HOURLY_RATES, MOCK_MEASUREMENT_TIERS, MOCK_EXTRA_TIERS, DEFAULT_PROJECT_STAGES_TEMPLATE, MOCK_OTHER_PAYMENTS, MOCK_PARTNERS, GANTT_STAGES_CONFIG, MOCK_NOTES, MOCK_VISIT_LOGS } from './constants';
import { supabase } from './supabaseClient';

type View = 'dashboard' | 'contracts' | 'new-contract' | 'progress' | 'projections' | 'receipts' | 'reminders' | 'settings' | 'database' | 'late-payments' | 'partners' | 'checklist' | 'notes' | 'tech-visits';

const getInitialData = (): AppData => ({
    clients: [],
    contracts: [],
    reminders: [],
    installments: [],
    schedules: [],
    projectProgress: [],
    servicePrices: MOCK_SERVICE_PRICES,
    hourlyRates: MOCK_HOURLY_RATES,
    measurementTiers: MOCK_MEASUREMENT_TIERS,
    extraTiers: MOCK_EXTRA_TIERS,
    projectStagesTemplate: DEFAULT_PROJECT_STAGES_TEMPLATE,
    otherPayments: [],
    partners: [],
    checklists: [],
    notes: [],
    visitLogs: [],
});

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li className="px-3">
    <button
      onClick={onClick}
      className={`flex items-center w-full px-3 py-2.5 text-left text-sm rounded-md transition-colors duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white font-semibold shadow-inner' 
          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </button>
  </li>
);

// Helper to calculate business days
const addWorkDays = (startDate: Date, days: number): Date => {
    const newDate = new Date(startDate);
    let dayOfWeek = newDate.getDay();
    if (dayOfWeek === 6) { newDate.setDate(newDate.getDate() + 2); }
    else if (dayOfWeek === 0) { newDate.setDate(newDate.getDate() + 1); }
    
    let addedDays = 0;
    while (addedDays < days) {
        newDate.setDate(newDate.getDate() + 1);
        dayOfWeek = newDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { addedDays++; }
    }
    return newDate;
};

// Helper to generate project schedule stages
const createScheduleStages = (template: ProjectStageTemplateItem[], startDateString: string): ProjectStage[] => {
    const stages: ProjectStage[] = [];
    if (!startDateString) return stages;

    let projectStartDateObj = new Date(startDateString);

    let dayOfWeek = projectStartDateObj.getDay();
    while (dayOfWeek === 0 || dayOfWeek === 6) { 
        projectStartDateObj.setDate(projectStartDateObj.getDate() + 1);
        dayOfWeek = projectStartDateObj.getDay();
    }
    
    template.forEach((stageTemplate, index) => {
        let currentStageStartDate: Date;

        if (index > 0) {
            const prevStage = stages[index - 1];
            const prevStageEndDate = prevStage.completionDate ? new Date(prevStage.completionDate) : new Date(prevStage.deadline!);
            currentStageStartDate = addWorkDays(prevStageEndDate, 1);
        } else {
            currentStageStartDate = new Date(projectStartDateObj);
        }
        
        const duration = Math.max(0, stageTemplate.durationWorkDays > 0 ? stageTemplate.durationWorkDays - 1 : 0);
        const deadline = addWorkDays(new Date(currentStageStartDate), duration);

        stages.push({
            id: stageTemplate.id,
            name: stageTemplate.name,
            durationWorkDays: stageTemplate.durationWorkDays,
            startDate: currentStageStartDate.toISOString().split('T')[0],
            deadline: deadline.toISOString().split('T')[0],
        });
    });
    return stages;
};

// Helper to generate project progress from a schedule
const generateProjectProgressFromSchedule = (schedule: ProjectSchedule): ProjectProgress => {
    const stageMapping: { [key: string]: string[] } = {
        'Briefing': ['Reunião de Briefing', 'Medição'],
        'Layout': ['Apresentação do Layout Planta Baixa', 'Revisão 01 (Planta Baixa)', 'Revisão 02 (Planta Baixa)', 'Revisão 03 (Planta Baixa)'],
        '3D': ['Apresentação de 3D', 'Revisão 01 (3D)', 'Revisão 02 (3D)', 'Revisão 03 (3D)'],
        'Executivo': ['Executivo'],
        'Entrega': ['Entrega'],
    };

    const progressStages: StageProgress[] = GANTT_STAGES_CONFIG.map(ganttStage => {
        const detailedStageNames = stageMapping[ganttStage.name] || [];
        const relevantDetailedStages = schedule.stages.filter(s => detailedStageNames.includes(s.name));
        
        if (relevantDetailedStages.length === 0) {
            return { name: ganttStage.name, status: 'pending' };
        }

        const completedCount = relevantDetailedStages.filter(s => s.completionDate).length;
        
        let status: 'completed' | 'in_progress' | 'pending';
        if (completedCount === relevantDetailedStages.length) {
            status = 'completed';
        } else if (completedCount > 0) {
            status = 'in_progress';
        } else {
            const firstStageOfGroup = relevantDetailedStages[0];
            const today = new Date();
            today.setHours(0,0,0,0);
            const stageStartDate = firstStageOfGroup.startDate ? new Date(firstStageOfGroup.startDate) : null;
            if(stageStartDate && stageStartDate <= today){
                status = 'in_progress';
            } else {
                status = 'pending';
            }
        }
        return { name: ganttStage.name, status };
    });

    return {
        contractId: schedule.contractId,
        projectName: schedule.projectName,
        clientName: schedule.clientName,
        stages: progressStages,
    };
};

// Recalculates all stage dates based on dependencies, preserving completion status.
const recalculateScheduleStages = (stages: ProjectStage[], projectStartDate: string): ProjectStage[] => {
    if (!projectStartDate) return stages;

    const calculatedStages: ProjectStage[] = [];
    let lastDate = new Date(projectStartDate);
    lastDate.setMinutes(lastDate.getMinutes() + lastDate.getTimezoneOffset());

    stages.forEach((stage, index) => {
        let currentStageStartDate: Date;

        if (index > 0) {
            const prevStage = calculatedStages[index - 1];
            const prevStageEndDate = prevStage.completionDate ? new Date(prevStage.completionDate) : new Date(prevStage.deadline!);
            prevStageEndDate.setMinutes(prevStageEndDate.getMinutes() + prevStageEndDate.getTimezoneOffset());
            currentStageStartDate = addWorkDays(prevStageEndDate, 1);
        } else {
            currentStageStartDate = new Date(lastDate);
        }
        
        const duration = Math.max(0, stage.durationWorkDays > 0 ? stage.durationWorkDays - 1 : 0);
        const deadline = addWorkDays(new Date(currentStageStartDate), duration);

        calculatedStages.push({
            ...stage,
            startDate: currentStageStartDate.toISOString().split('T')[0],
            deadline: deadline.toISOString().split('T')[0],
        });
    });
    return calculatedStages;
};


const generateDependentData = (contract: Contract, projectStagesTemplate: ProjectStageTemplateItem[]) => {
    const newInstallments: PaymentInstallment[] = [];
    if (contract.downPayment > 0) {
        newInstallments.push({
            id: Date.now(),
            contractId: contract.id,
            clientName: contract.clientName,
            projectName: contract.projectName,
            installment: 'Entrada',
            dueDate: contract.downPaymentDate,
            value: contract.downPayment,
            status: 'Pendente', 
        });
    }

    if (contract.installments > 0 && contract.firstInstallmentDate) {
        const firstDate = new Date(contract.firstInstallmentDate);
        for (let i = 0; i < contract.installments; i++) {
            const dueDate = new Date(firstDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            newInstallments.push({
                id: Date.now() + i + 1,
                contractId: contract.id,
                clientName: contract.clientName,
                projectName: contract.projectName,
                installment: `${i + 1}/${contract.installments}`,
                dueDate: dueDate,
                value: contract.installmentValue,
                status: 'Pendente',
            });
        }
    }

    const newSchedule: ProjectSchedule = {
        id: Date.now(),
        contractId: contract.id,
        clientName: contract.clientName,
        projectName: contract.projectName,
        startDate: new Date(contract.date).toISOString().split('T')[0],
        stages: createScheduleStages(projectStagesTemplate, new Date(contract.date).toISOString()),
    };

    const newProgress = generateProjectProgressFromSchedule(newSchedule);

    return { newInstallments, newSchedule, newProgress };
};


export default function App() {
  const [appData, setAppData] = useState<AppData>(getInitialData());
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>('contracts');
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // LOAD DATA FROM SUPABASE
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
            { data: clients },
            { data: contracts },
            { data: installments },
            { data: notes },
            { data: partners },
            { data: visitLogs },
            { data: checklists }
        ] = await Promise.all([
            supabase.from('clients').select('*'),
            supabase.from('contracts').select('*'),
            supabase.from('installments').select('*'),
            supabase.from('notes').select('*'),
            supabase.from('partners').select('*'),
            supabase.from('visit_logs').select('*'),
            supabase.from('checklists').select('*')
        ]);

        // Process Contracts to extract extended data (services, schedule, etc.)
        const processedContracts: Contract[] = (contracts || []).map((c: any) => ({
            id: c.id,
            clientName: c.client_name,
            projectName: c.project_name,
            status: c.status,
            totalValue: c.data?.totalValue || 0,
            date: c.data?.date,
            durationMonths: c.data?.durationMonths,
            clientAddress: c.data?.clientAddress,
            projectAddress: c.data?.projectAddress,
            downPayment: c.data?.downPayment,
            installments: c.data?.installments,
            installmentValue: c.data?.installmentValue,
            serviceType: c.data?.serviceType,
            attachments: c.data?.attachments,
            services: c.data?.services || [],
            discountType: c.data?.discountType,
            discountValue: c.data?.discountValue,
            mileageDistance: c.data?.mileageDistance,
            mileageCost: c.data?.mileageCost,
            techVisits: c.data?.techVisits,
            downPaymentDate: c.data?.downPaymentDate,
            firstInstallmentDate: c.data?.firstInstallmentDate,
        }));

        // Extract Schedules and Progress from contract data (assuming we store them there for now)
        // If they weren't stored in the 'data' column in your SQL, they might be missing.
        // For this implementation, I will assume we store the schedule in the contract's 'data' JSONB.
        const schedules: ProjectSchedule[] = (contracts || []).map((c: any) => c.data?.schedule).filter(Boolean);
        const projectProgress = schedules.map(generateProjectProgressFromSchedule);

        const processedInstallments: PaymentInstallment[] = (installments || []).map((i: any) => ({
            id: i.id,
            contractId: i.contract_id,
            clientName: i.client_name,
            projectName: i.project_name,
            installment: i.installment,
            dueDate: i.due_date,
            value: i.value,
            status: i.status,
            paymentDate: i.payment_date
        }));

        const processedNotes: Note[] = (notes || []).map((n: any) => ({
            id: n.id,
            contractId: n.contract_id,
            title: n.title,
            content: n.content,
            alertDate: n.alert_date,
            completed: n.completed,
            createdAt: n.created_at
        }));

        const processedVisitLogs: VisitLog[] = (visitLogs || []).map((v: any) => ({
            id: v.id,
            contractId: v.contract_id,
            date: v.date,
            notes: v.notes,
            createdAt: v.created_at
        }));
        
        const processedChecklists: ProjectChecklist[] = (checklists || []).map((c: any) => ({
            contractId: c.contract_id,
            completedItemIds: c.completed_ids
        }));

        // Partners mapping
        const processedPartners: Partner[] = (partners || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            contactPerson: p.data?.contactPerson,
            phone: p.data?.phone,
            email: p.data?.email,
            address: p.data?.address,
            clientIds: p.data?.clientIds
        }));

        setAppData(prev => ({
            ...prev,
            clients: (clients || []).map((c: any) => ({ id: c.id, name: c.name, logoUrl: c.logo_url })),
            contracts: processedContracts,
            installments: processedInstallments,
            schedules: schedules,
            projectProgress: projectProgress,
            notes: processedNotes,
            visitLogs: processedVisitLogs,
            checklists: processedChecklists,
            partners: processedPartners,
        }));

      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
        alert("Erro ao conectar com o banco de dados. Verifique sua chave API.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);


  const handleAddContract = async (newContract: Omit<Contract, 'id'>) => {
    const contractId = Date.now();
    const contractWithId: Contract = { ...newContract, id: contractId };
    const { newInstallments, newSchedule, newProgress } = generateDependentData(contractWithId, appData.projectStagesTemplate);

    // Save to State (Optimistic)
    setAppData(prev => ({
        ...prev,
        contracts: [contractWithId, ...prev.contracts],
        installments: [...newInstallments, ...prev.installments],
        schedules: [newSchedule, ...prev.schedules],
        projectProgress: [newProgress, ...(prev.projectProgress || [])],
        clients: prev.clients.some(c => c.name === contractWithId.clientName) 
            ? prev.clients 
            : [{ id: Date.now() + 1, name: contractWithId.clientName }, ...prev.clients]
    }));
    setView('contracts');

    // Save to Supabase
    try {
        // 1. Client (if new)
        const clientExists = appData.clients.some(c => c.name === contractWithId.clientName);
        if (!clientExists) {
            await supabase.from('clients').insert({ id: Date.now() + 1, name: contractWithId.clientName });
        }

        // 2. Contract (Save heavy data in JSONB 'data' column, including schedule)
        await supabase.from('contracts').insert({
            id: contractId,
            client_name: contractWithId.clientName,
            project_name: contractWithId.projectName,
            status: contractWithId.status,
            data: { 
                ...contractWithId, 
                schedule: newSchedule // Embed schedule in contract data
            }
        });

        // 3. Installments
        const dbInstallments = newInstallments.map(i => ({
            id: i.id,
            contract_id: i.contractId,
            client_name: i.clientName,
            project_name: i.projectName,
            installment: i.installment,
            due_date: i.dueDate,
            value: i.value,
            status: i.status
        }));
        await supabase.from('installments').insert(dbInstallments);

    } catch (err) {
        console.error("Erro ao salvar no Supabase", err);
    }
  };
  
  const handleUpdateContract = async (updatedContract: Contract) => {
    // Logic mostly same as before for state, but added Supabase calls
    const newInstallments: PaymentInstallment[] = [];
    if (updatedContract.downPayment > 0) {
        const existingDownPayment = appData.installments.find(i => i.contractId === updatedContract.id && i.installment === 'Entrada');
        const isPaid = existingDownPayment?.status.includes('Pago');
        newInstallments.push({
            id: Date.now(),
            contractId: updatedContract.id,
            clientName: updatedContract.clientName,
            projectName: updatedContract.projectName,
            installment: 'Entrada',
            dueDate: updatedContract.downPaymentDate,
            value: updatedContract.downPayment,
            status: isPaid ? existingDownPayment.status : 'Pendente',
            paymentDate: isPaid ? existingDownPayment.paymentDate : undefined,
        });
    }

    if (updatedContract.installments > 0 && updatedContract.firstInstallmentDate) {
        const firstDate = new Date(updatedContract.firstInstallmentDate);
        for (let i = 0; i < updatedContract.installments; i++) {
            const dueDate = new Date(firstDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            newInstallments.push({
                id: Date.now() + i + 1,
                contractId: updatedContract.id,
                clientName: updatedContract.clientName,
                projectName: updatedContract.projectName,
                installment: `${i + 1}/${updatedContract.installments}`,
                dueDate: dueDate,
                value: updatedContract.installmentValue,
                status: 'Pendente',
            });
        }
    }

    const existingSchedule = appData.schedules.find(s => s.contractId === updatedContract.id);
    const baseStages = existingSchedule ? existingSchedule.stages : createScheduleStages(appData.projectStagesTemplate, new Date(updatedContract.date).toISOString());
    const updatedStages = recalculateScheduleStages(baseStages, new Date(updatedContract.date).toISOString().split('T')[0]);

    const newSchedule: ProjectSchedule = {
        id: existingSchedule ? existingSchedule.id : Date.now(),
        contractId: updatedContract.id,
        clientName: updatedContract.clientName,
        projectName: updatedContract.projectName,
        startDate: new Date(updatedContract.date).toISOString().split('T')[0],
        stages: updatedStages,
    };

    const newProgress = generateProjectProgressFromSchedule(newSchedule);
    
    setAppData(prev => ({
        ...prev,
        contracts: prev.contracts.map(c => c.id === updatedContract.id ? updatedContract : c),
        installments: [...prev.installments.filter(i => i.contractId !== updatedContract.id), ...newInstallments],
        schedules: [...prev.schedules.filter(s => s.contractId !== updatedContract.id), newSchedule],
        projectProgress: [...(prev.projectProgress || []).filter(p => p.contractId !== updatedContract.id), newProgress],
    }));
    setEditingContract(null);
    setView('contracts');

    // Supabase Update
    try {
        // Update Contract & Schedule
        await supabase.from('contracts').update({
            client_name: updatedContract.clientName,
            project_name: updatedContract.projectName,
            status: updatedContract.status,
            data: { ...updatedContract, schedule: newSchedule }
        }).eq('id', updatedContract.id);

        // Replace Installments (Delete old -> Insert new)
        await supabase.from('installments').delete().eq('contract_id', updatedContract.id);
        
        const dbInstallments = newInstallments.map(i => ({
            id: i.id,
            contract_id: i.contractId,
            client_name: i.clientName,
            project_name: i.projectName,
            installment: i.installment,
            due_date: i.dueDate,
            value: i.value,
            status: i.status,
            payment_date: i.paymentDate
        }));
        await supabase.from('installments').insert(dbInstallments);

    } catch (err) {
        console.error("Erro ao atualizar no Supabase", err);
    }
  };

  const handleDeleteContract = async (contractId: number) => {
    setAppData(prev => ({
        ...prev,
        contracts: prev.contracts.filter(c => c.id !== contractId),
        installments: prev.installments.filter(i => i.contractId !== contractId),
        schedules: prev.schedules.filter(s => s.contractId !== contractId),
        projectProgress: prev.projectProgress?.filter(p => p.contractId !== contractId),
        checklists: prev.checklists ? prev.checklists.filter(c => c.contractId !== contractId) : [],
        visitLogs: prev.visitLogs ? prev.visitLogs.filter(v => v.contractId !== contractId) : [],
    }));

    // Supabase Delete
    try {
        // Cascade deletion should ideally be handled by DB, but here we do manual to be safe
        await supabase.from('installments').delete().eq('contract_id', contractId);
        await supabase.from('notes').delete().eq('contract_id', contractId);
        await supabase.from('visit_logs').delete().eq('contract_id', contractId);
        await supabase.from('checklists').delete().eq('contract_id', contractId);
        await supabase.from('contracts').delete().eq('id', contractId);
    } catch (err) {
        console.error("Erro ao excluir do Supabase", err);
    }
  };
  
  const handleAddPartner = async (newPartner: Omit<Partner, 'id'>) => {
    const id = Date.now();
    const p = { ...newPartner, id };
    setAppData(prev => ({ ...prev, partners: [p, ...prev.partners] }));
    
    // Supabase
    await supabase.from('partners').insert({
        id,
        name: p.name,
        type: p.type,
        data: { contactPerson: p.contactPerson, phone: p.phone, email: p.email, address: p.address, clientIds: p.clientIds }
    });
  };

  const handleUpdatePartner = async (updatedPartner: Partner) => {
    setAppData(prev => ({ ...prev, partners: prev.partners.map(p => p.id === updatedPartner.id ? updatedPartner : p) }));
    await supabase.from('partners').update({
        name: updatedPartner.name,
        type: updatedPartner.type,
        data: { contactPerson: updatedPartner.contactPerson, phone: updatedPartner.phone, email: updatedPartner.email, address: updatedPartner.address, clientIds: updatedPartner.clientIds }
    }).eq('id', updatedPartner.id);
  };

  const handleDeletePartner = async (partnerId: number) => {
    setAppData(prev => ({ ...prev, partners: prev.partners.filter(p => p.id !== partnerId) }));
    await supabase.from('partners').delete().eq('id', partnerId);
  };

  const handleUpdateChecklist = async (updatedChecklist: ProjectChecklist) => {
    setAppData(prev => {
        const currentChecklists = prev.checklists || [];
        const existingIndex = currentChecklists.findIndex(c => c.contractId === updatedChecklist.contractId);
        if (existingIndex >= 0) {
            const newChecklists = [...currentChecklists];
            newChecklists[existingIndex] = updatedChecklist;
            return { ...prev, checklists: newChecklists };
        } else {
            return { ...prev, checklists: [...currentChecklists, updatedChecklist] };
        }
    });

    // Upsert Checklist
    const { error } = await supabase.from('checklists').upsert({
        contract_id: updatedChecklist.contractId,
        completed_ids: updatedChecklist.completedItemIds
    });
    if (error) console.error("Erro ao salvar checklist", error);
  };

  const handleAddNote = async (newNote: Omit<Note, 'id' | 'createdAt'>) => {
      const id = Date.now();
      const createdAt = new Date().toISOString();
      const note = { ...newNote, id, createdAt };
      
      setAppData(prev => ({ ...prev, notes: [note, ...(prev.notes || [])] }));

      await supabase.from('notes').insert({
          id,
          contract_id: note.contractId,
          title: note.title,
          content: note.content,
          alert_date: note.alertDate,
          completed: note.completed,
          created_at: createdAt
      });
  };

  const handleUpdateNote = async (updatedNote: Note) => {
      setAppData(prev => ({ ...prev, notes: (prev.notes || []).map(n => n.id === updatedNote.id ? updatedNote : n) }));
      await supabase.from('notes').update({
          title: updatedNote.title,
          content: updatedNote.content,
          alert_date: updatedNote.alertDate,
          completed: updatedNote.completed
      }).eq('id', updatedNote.id);
  };

  const handleDeleteNote = async (id: number) => {
      setAppData(prev => ({ ...prev, notes: (prev.notes || []).filter(n => n.id !== id) }));
      await supabase.from('notes').delete().eq('id', id);
  };

  const handleAddVisitLog = async (newLog: Omit<VisitLog, 'id' | 'createdAt'>) => {
      const id = Date.now();
      const createdAt = new Date().toISOString();
      const log = { ...newLog, id, createdAt };
      
      setAppData(prev => ({ ...prev, visitLogs: [log, ...(prev.visitLogs || [])] }));

      await supabase.from('visit_logs').insert({
          id,
          contract_id: log.contractId,
          date: log.date,
          notes: log.notes,
          created_at: createdAt
      });
  };

  const handleResetData = async () => {
    if (window.confirm('ATENÇÃO: Você está prestes a limpar o banco de dados NA NUVEM. Isso apagará tudo para todos os usuários. Tem certeza?')) {
        // DANGER ZONE
        await supabase.from('installments').delete().neq('id', 0);
        await supabase.from('notes').delete().neq('id', 0);
        await supabase.from('visit_logs').delete().neq('id', 0);
        await supabase.from('checklists').delete().neq('contract_id', 0);
        await supabase.from('contracts').delete().neq('id', 0);
        await supabase.from('clients').delete().neq('id', 0);
        await supabase.from('partners').delete().neq('id', 0);
        
        setAppData(getInitialData());
        alert('Banco de dados na nuvem limpo com sucesso!');
    }
  };

  const handleStartEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setView('new-contract');
  };
  
  const handleCreateProject = () => {
      setEditingContract(null);
      setView('new-contract');
  }

  const handleAddOtherPayment = (newPayment: Omit<OtherPayment, 'id'>) => {
    // Currently other payments are local-only or saved in a generic way?
    // The schema didn't have 'other_payments'. We will store in local state for now or map to installments?
    // For now, keep local as requested feature set might have expanded beyond schema provided.
    // Ideally create a table for this.
    const paymentWithId: OtherPayment = { ...newPayment, id: Date.now() };
    setAppData(prev => ({ ...prev, otherPayments: [paymentWithId, ...prev.otherPayments] }));
  };
  
  const handleEditNoteFromDashboard = (note: Note) => {
    setView('notes');
  };


  const monthlyRevenue = useMemo(() => {
    const monthlyData = Array(12).fill(0).map((_, i) => ({
      name: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
      value: 0,
    }));
    
    const currentYear = new Date().getFullYear();

    appData.installments.forEach((installment: PaymentInstallment) => {
        if (installment.status !== 'Pendente' && installment.paymentDate) {
            const paymentDate = new Date(installment.paymentDate);
            if (paymentDate.getFullYear() === currentYear) {
                const monthIndex = paymentDate.getMonth();
                monthlyData[monthIndex].value += installment.value;
            }
        }
    });

    return monthlyData;
  }, [appData.installments, appData.otherPayments]);

  const renderView = () => {
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Carregando dados da nuvem...</p>
                </div>
            </div>
        );
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard 
                  installments={appData.installments}
                  setInstallments={(newInstallments) => {
                      // Handle Payment Status Update (Special Case)
                      // Find which installment changed
                      const changed = newInstallments.find(ni => {
                          const old = appData.installments.find(oi => oi.id === ni.id);
                          return old && old.status !== ni.status;
                      });
                      if (changed) {
                          // Optimistic
                          setAppData(prev => ({...prev, installments: newInstallments}));
                          // DB Update
                          supabase.from('installments').update({
                              status: changed.status,
                              payment_date: changed.paymentDate
                          }).eq('id', changed.id).then();
                      }
                  }}
                  contracts={appData.contracts}
                  schedules={appData.schedules}
                  projectProgress={appData.projectProgress || []}
                  otherPayments={appData.otherPayments}
                  onAddOtherPayment={handleAddOtherPayment}
                  notes={appData.notes || []}
                  onUpdateNote={handleUpdateNote}
                  onEditNoteClick={handleEditNoteFromDashboard}
                />;
      case 'contracts':
        return <Contracts 
                    contracts={appData.contracts}
                    schedules={appData.schedules}
                    clients={appData.clients}
                    onEditContract={handleStartEditContract}
                    onDeleteContract={handleDeleteContract}
                    onCreateProject={handleCreateProject}
                />;
      case 'new-contract':
        return <NewContract 
                    appData={appData} 
                    onAddContract={handleAddContract}
                    onUpdateContract={handleUpdateContract}
                    editingContract={editingContract}
                    onCancel={() => { setEditingContract(null); setView('contracts'); }}
                />;
      case 'progress':
        return <Progress 
                  schedules={appData.schedules}
                  setSchedules={(newSchedules) => {
                      // Schedule Update Logic
                      // Find changed schedule
                      const changed = newSchedules.find(ns => {
                          const old = appData.schedules.find(os => os.id === ns.id);
                          return JSON.stringify(old) !== JSON.stringify(ns);
                      });
                      
                      if(changed) {
                          const contract = appData.contracts.find(c => c.id === changed.contractId);
                          if(contract) {
                              const newProgress = generateProjectProgressFromSchedule(changed);
                              setAppData(prev => ({
                                  ...prev, 
                                  schedules: newSchedules,
                                  projectProgress: prev.projectProgress?.map(p => p.contractId === contract.id ? newProgress : p)
                              }));
                              // Save deeply to contract data
                              supabase.from('contracts').update({
                                  data: { ...contract, schedule: changed }
                              }).eq('id', contract.id).then();
                          }
                      }
                  }}
                  contracts={appData.contracts}
                />;
      case 'projections':
        return <Projections 
                  installments={appData.installments} 
                  otherPayments={appData.otherPayments}
                  contracts={appData.contracts}
                />;
      case 'late-payments':
        return <LatePayments installments={appData.installments} />;
      case 'receipts':
        return <Receipts contracts={appData.contracts} installments={appData.installments} />;
      case 'reminders':
        return <Reminders 
                  reminders={appData.reminders}
                  setReminders={(newReminders) => setAppData(prev => ({...prev, reminders: newReminders}))}
                  clients={appData.clients}
                />;
       case 'partners':
        return <Partners 
                  partners={appData.partners}
                  clients={appData.clients}
                  onAddPartner={handleAddPartner}
                  onUpdatePartner={handleUpdatePartner}
                  onDeletePartner={handleDeletePartner}
                />;
        case 'checklist':
          return <ConstructionChecklist
                    contracts={appData.contracts}
                    checklists={appData.checklists}
                    onUpdateChecklist={handleUpdateChecklist}
                />;
        case 'notes':
            return <Notes
                notes={appData.notes || []}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                contracts={appData.contracts}
            />;
        case 'tech-visits':
            return <TechnicalVisits
                contracts={appData.contracts}
                visitLogs={appData.visitLogs || []}
                onAddVisitLog={handleAddVisitLog}
            />;
       case 'database':
        return <Database
                  appData={appData}
                  setAppData={setAppData as React.Dispatch<React.SetStateAction<AppData>>}
                  onDeleteContract={handleDeleteContract}
                  onResetData={handleResetData}
                />;
      case 'settings':
        return <Settings 
                    appData={appData}
                    setAppData={setAppData as React.Dispatch<React.SetStateAction<AppData>>}
                />;
      default:
        return <Dashboard 
                  installments={appData.installments}
                  setInstallments={(newInstallments) => setAppData(prev => ({...prev, installments: newInstallments}))}
                  contracts={appData.contracts}
                  schedules={appData.schedules}
                  projectProgress={appData.projectProgress || []}
                  otherPayments={appData.otherPayments}
                  onAddOtherPayment={handleAddOtherPayment}
                  notes={appData.notes || []}
                  onUpdateNote={handleUpdateNote}
                  onEditNoteClick={handleEditNoteFromDashboard}
               />;
    }
  }

  return (
    <div className="flex min-h-screen font-sans text-slate-800">
      <aside className="w-64 flex-shrink-0 bg-gray-900 text-white">
        <div className="h-full flex flex-col">
          <div className="flex items-center p-6 border-b border-gray-800">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <WalletIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
                <h1 className="text-base font-bold text-white">E-Projet</h1>
                <p className="text-xs text-slate-400">
                    {isLoading ? 'Conectando...' : 'Online (Supabase)'}
                </p>
            </div>
          </div>
          <nav className="mt-6 flex-1 overflow-y-auto">
            <p className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
            <ul className="mt-3 space-y-1">
                <NavItem
                  icon={<DashboardIcon className="w-5 h-5" />}
                  label="Dashboard"
                  isActive={view === 'dashboard'}
                  onClick={() => setView('dashboard')}
                />
                <NavItem
                  icon={<FileTextIcon className="w-5 h-5" />}
                  label="Projetos"
                  isActive={view === 'contracts'}
                  onClick={() => setView('contracts')}
                />
                <NavItem
                  icon={<PlusIcon className="w-5 h-5" />}
                  label="Novo Contrato"
                  isActive={view === 'new-contract'}
                  onClick={() => {
                    setEditingContract(null);
                    setView('new-contract');
                  }}
                />
                <NavItem
                  icon={<TrendingUpIcon className="w-5 h-5" />}
                  label="Progresso"
                  isActive={view === 'progress'}
                  onClick={() => setView('progress')}
                />
                <NavItem
                  icon={<ClipboardCheckIcon className="w-5 h-5" />}
                  label="Checklist Obra"
                  isActive={view === 'checklist'}
                  onClick={() => setView('checklist')}
                />
                <NavItem
                    icon={<MapPinIcon className="w-5 h-5" />}
                    label="Visitas Técnicas"
                    isActive={view === 'tech-visits'}
                    onClick={() => setView('tech-visits')}
                />
                <NavItem
                  icon={<CashIcon className="w-5 h-5" />}
                  label="Projeções e Recebidos"
                  isActive={view === 'projections'}
                  onClick={() => setView('projections')}
                />
                 <NavItem
                  icon={<ExclamationTriangleIcon className="w-5 h-5" />}
                  label="Parcelas Atrasadas"
                  isActive={view === 'late-payments'}
                  onClick={() => setView('late-payments')}
                />
                 <NavItem
                  icon={<ReceiptIcon className="w-5 h-5" />}
                  label="Recibos"
                  isActive={view === 'receipts'}
                  onClick={() => setView('receipts')}
                />
                <NavItem
                  icon={<BellIcon className="w-5 h-5" />}
                  label="Lembretes"
                  isActive={view === 'reminders'}
                  onClick={() => setView('reminders')}
                />
                 <NavItem
                  icon={<NotepadIcon className="w-5 h-5" />}
                  label="Bloco de Notas"
                  isActive={view === 'notes'}
                  onClick={() => setView('notes')}
                />
                 <NavItem
                  icon={<UsersIcon className="w-5 h-5" />}
                  label="Parceiros"
                  isActive={view === 'partners'}
                  onClick={() => setView('partners')}
                />
            </ul>
            <p className="px-6 mt-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Configurações</p>
             <ul className="mt-3 space-y-1">
                <NavItem
                  icon={<DatabaseIcon className="w-5 h-5" />}
                  label="Banco de Dados"
                  isActive={view === 'database'}
                  onClick={() => setView('database')}
                />
                <NavItem
                  icon={<CogIcon className="w-5 h-5" />}
                  label="Configurações"
                  isActive={view === 'settings'}
                  onClick={() => setView('settings')}
                />
            </ul>
          </nav>

          <div className="p-4 mt-auto border-t border-gray-800">
              <MonthlyRevenueChart data={monthlyRevenue} />
          </div>

        </div>
      </aside>

      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-auto bg-slate-100/80 backdrop-blur-sm">
        {renderView()}
      </main>
    </div>
  );
}
