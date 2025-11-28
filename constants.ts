

import { Client, PaymentInstallment, AttentionPoint, Reminder, Contract, ProjectProgress, Address, ProjectSchedule, ServicePrice, PriceTier, ProjectStageTemplateItem, OtherPayment, ProjectStage, Partner, StageProgress, ChecklistItemTemplate, Note, VisitLog } from './types';

export const CLIENTS: Client[] = [];

export const MOCK_ATTENTION_POINTS: AttentionPoint[] = [];

export const MOCK_REMINDERS: Reminder[] = [];

const MOCK_ADDRESS: Address = { street: 'Rua Fictícia', number: '123', district: 'Centro', city: 'São Paulo', state: 'SP', cep: '01000-000' };


export const MOCK_OTHER_PAYMENTS: OtherPayment[] = [];

export const MOCK_PARTNERS: Partner[] = [];

export const MOCK_NOTES: Note[] = [];

export const MOCK_VISIT_LOGS: VisitLog[] = [];

export const PARTNER_TYPES: string[] = [
    'Gesso',
    'Elétrica/Hidráulica',
    'Construtora',
    'Material de Construção',
    'Marcenaria',
    'Pintura',
    'Serralheria',
    'Vidraçaria',
    'Marmoraria',
    'Automação',
    'Paisagismo',
    'Outro',
];

// Template do Checklist de Obra (Resumido e Prático)
export const CHECKLIST_TEMPLATE: ChecklistItemTemplate[] = [
    // ETAPA 1: INÍCIO E BRIEFING
    { id: 1, stage: '1. INÍCIO E BRIEFING', text: 'Criar grupo do cliente e pasta na nuvem' },
    { id: 2, stage: '1. INÍCIO E BRIEFING', text: 'Reunião de Briefing realizada e Ata assinada' },
    { id: 3, stage: '1. INÍCIO E BRIEFING', text: 'Levantamento/Medição in loco realizado' },
    { id: 4, stage: '1. INÍCIO E BRIEFING', text: 'Fotos do local salvas e organizadas' },

    // ETAPA 2: ESTUDO E 3D (CRIATIVO)
    { id: 5, stage: '2. ESTUDO E 3D (CRIATIVO)', text: 'Digitalização da planta base' },
    { id: 6, stage: '2. ESTUDO E 3D (CRIATIVO)', text: 'Definição de Layout aprovada' },
    { id: 7, stage: '2. ESTUDO E 3D (CRIATIVO)', text: 'Modelagem 3D e Renderização concluídos' },
    { id: 8, stage: '2. ESTUDO E 3D (CRIATIVO)', text: 'Apresentação realizada e Projeto aprovado (Assinatura)' },

    // ETAPA 3: PROJETO EXECUTIVO
    { id: 9, stage: '3. PROJETO EXECUTIVO', text: 'Plantas técnicas (Demolição/Construção/Pontos) finalizadas' },
    { id: 10, stage: '3. PROJETO EXECUTIVO', text: 'Detalhamento de Marcenaria e Marmoraria' },
    { id: 11, stage: '3. PROJETO EXECUTIVO', text: 'Compatibilização com complementares (Estrutural/Elétrica)' },
    { id: 12, stage: '3. PROJETO EXECUTIVO', text: 'Entrega do caderno executivo para obra e cliente' },

    // ETAPA 4: ORÇAMENTOS E COMPRAS
    { id: 13, stage: '4. ORÇAMENTOS E COMPRAS', text: 'Orçamentos de revestimentos e louças aprovados' },
    { id: 14, stage: '4. ORÇAMENTOS E COMPRAS', text: 'Orçamentos de Iluminação aprovados' },
    { id: 15, stage: '4. ORÇAMENTOS E COMPRAS', text: 'Contratação de Marcenaria e Marmoraria' },
    { id: 16, stage: '4. ORÇAMENTOS E COMPRAS', text: 'Cronograma de compras e entregas alinhado' },

    // ETAPA 5: VISITAS E ACOMPANHAMENTO (OBRA)
    { id: 17, stage: '5. VISITAS E ACOMPANHAMENTO (OBRA)', text: 'Visita: Conferência de Demolição e Limpeza' },
    { id: 18, stage: '5. VISITAS E ACOMPANHAMENTO (OBRA)', text: 'Visita: Marcação de pontos (Elétrica/Hidráulica) conferida' },
    { id: 19, stage: '5. VISITAS E ACOMPANHAMENTO (OBRA)', text: 'Visita: Conferência de Alvenaria e Gesso (Forro/Paredes)' },
    { id: 20, stage: '5. VISITAS E ACOMPANHAMENTO (OBRA)', text: 'Visita: Acompanhamento de assentamento de revestimentos' },
    { id: 21, stage: '5. VISITAS E ACOMPANHAMENTO (OBRA)', text: 'Visita: Conferência de medição final para Marcenaria/Pedras' },
    { id: 22, stage: '5. VISITAS E ACOMPANHAMENTO (OBRA)', text: 'Visita: Instalação de Pedras/Bancadas' },
    { id: 23, stage: '5. VISITAS E ACOMPANHAMENTO (OBRA)', text: 'Visita: Vistoria de Pintura e acabamentos finais' },

    // ETAPA 6: PRODUÇÃO E ENTREGA
    { id: 24, stage: '6. PRODUÇÃO E ENTREGA', text: 'Acompanhamento da montagem de Marcenaria' },
    { id: 25, stage: '6. PRODUÇÃO E ENTREGA', text: 'Instalação de Iluminação e Metais conferida' },
    { id: 26, stage: '6. PRODUÇÃO E ENTREGA', text: 'Limpeza pós-obra realizada' },
    { id: 27, stage: '6. PRODUÇÃO E ENTREGA', text: 'Produção (Decoração e Mobiliário solto)' },
    { id: 28, stage: '6. PRODUÇÃO E ENTREGA', text: 'Sessão de fotos final' },
    { id: 29, stage: '6. PRODUÇÃO E ENTREGA', text: 'Entrega oficial do sonho (Chaves/Presente)' },
];

export const DEFAULT_PROJECT_STAGES_TEMPLATE: ProjectStageTemplateItem[] = [
    { id: 1, name: 'Reunião de Briefing', durationWorkDays: 1, sequence: 1 },
    { id: 2, name: 'Medição', durationWorkDays: 1, sequence: 2 }, 
    { id: 3, name: 'Apresentação do Layout Planta Baixa', durationWorkDays: 15, sequence: 3 },
    { id: 4, name: 'Revisão 01 (Planta Baixa)', durationWorkDays: 7, sequence: 4 },
    { id: 5, name: 'Revisão 02 (Planta Baixa)', durationWorkDays: 7, sequence: 5 },
    { id: 6, name: 'Revisão 03 (Planta Baixa)', durationWorkDays: 7, sequence: 6 },
    { id: 7, name: 'Apresentação de 3D', durationWorkDays: 15, sequence: 7 },
    { id: 8, name: 'Revisão 01 (3D)', durationWorkDays: 7, sequence: 8 },
    { id: 9, name: 'Revisão 02 (3D)', durationWorkDays: 7, sequence: 9 },
    { id: 10, name: 'Revisão 03 (3D)', durationWorkDays: 7, sequence: 10 },
    { id: 11, name: 'Executivo', durationWorkDays: 20, sequence: 11 },
    { id: 12, name: 'Entrega', durationWorkDays: 0, sequence: 12 },
];


// Helper function to create schedule data
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

const createScheduleStages = (template: ProjectStageTemplateItem[], startDateString: string, completedStagesCount: number = 0): ProjectStage[] => {
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

        const completionDate = index < completedStagesCount ? deadline.toISOString().split('T')[0] : undefined;

        stages.push({
            id: stageTemplate.id,
            name: stageTemplate.name,
            durationWorkDays: stageTemplate.durationWorkDays,
            startDate: currentStageStartDate.toISOString().split('T')[0],
            deadline: deadline.toISOString().split('T')[0],
            completionDate: completionDate,
        });
    });
    return stages;
};


export const MOCK_PROJECT_SCHEDULES: ProjectSchedule[] = [];

export const MOCK_CONTRACTS: Contract[] = [];

export const INITIAL_INSTALLMENTS: PaymentInstallment[] = [];

export const GANTT_STAGES_CONFIG: { name: string, duration: number }[] = [
    { name: 'Briefing', duration: 3 },
    { name: 'Layout', duration: 20 },
    { name: '3D', duration: 20 },
    { name: 'Executivo', duration: 25 },
    { name: 'Entrega', duration: 2 },
];

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

export const MOCK_PROJECT_PROGRESS: ProjectProgress[] = MOCK_PROJECT_SCHEDULES.map(generateProjectProgressFromSchedule);

export const MOCK_SERVICE_PRICES: ServicePrice[] = [
    { id: 1, name: 'Arquitetônico', unit: 'm²' },
    { id: 2, name: 'Estrutural', price: 15, unit: 'm²' },
    { id: 3, name: 'Projeto do Zero', price: 40, unit: 'm²' },
    { id: 4, name: 'Design de Interiores', unit: 'm²' },
    { id: 5, name: 'Medição e Planta Baixa', unit: 'un' },
    { id: 6, name: 'Consultoria', unit: 'un' },
    { id: 7, name: 'Terceiros', unit: 'un' },
    { id: 8, name: 'RT (Responsabilidade Técnica)', unit: 'un' },
    { id: 9, name: 'Gerenciamento de Obras', price: 1400, unit: 'mês' },
    { id: 10, name: 'Averbação', unit: 'un' },
];

export const MOCK_HOURLY_RATES: ServicePrice[] = [
    { id: 1, name: 'Visita Técnica', price: 80, unit: 'hora' },
];

export const MOCK_MEASUREMENT_TIERS: PriceTier[] = [
    { id: 1, range: '0 a 50 m²', price: 1000 },
    { id: 2, range: '51 a 100 m²', price: 1500 },
];

export const MOCK_EXTRA_TIERS: PriceTier[] = [];