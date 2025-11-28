

// Represents a single stage item in the customizable template
export interface ProjectStageTemplateItem {
    id: number;
    name: string;
    durationWorkDays: number;
    sequence: number;
}

export interface OtherPayment {
    id: number;
    description: string;
    paymentDate: Date;
    value: number;
}

// Represents a partner or supplier
export interface Partner {
    id: number;
    name: string;
    type: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: Address;
    clientIds?: number[];
}

// Checklist Types
export interface ChecklistItemTemplate {
    id: number;
    text: string;
    stage: string;
}

export interface ProjectChecklist {
    contractId: number;
    completedItemIds: number[];
}

// Note / Notepad Types
export interface Note {
    id: number;
    contractId?: number; // Vincula a nota a um contrato/cliente específico
    title: string;
    content: string;
    alertDate?: string; // YYYY-MM-DD
    completed: boolean;
    createdAt: string;
}

// Technical Visit Log
export interface VisitLog {
    id: number;
    contractId: number;
    date: string;
    notes: string;
    createdAt: string;
}

export interface AppData {
    // Fix: Add clients to AppData to be used in the Database component.
    clients: Client[];
    contracts: Contract[];
    reminders: Reminder[];
    installments: PaymentInstallment[];
    schedules: ProjectSchedule[];
    servicePrices: ServicePrice[];
    hourlyRates: ServicePrice[];
    measurementTiers: PriceTier[];
    extraTiers: PriceTier[];
    projectProgress?: ProjectProgress[]; // Optional for now
    projectStagesTemplate: ProjectStageTemplateItem[];
    otherPayments: OtherPayment[];
    partners: Partner[];
    checklists: ProjectChecklist[];
    notes: Note[];
    visitLogs: VisitLog[];
}

export interface Client {
  id: number;
  name: string;
  logoUrl?: string;
}

export enum ProjectStatus {
  OnTime = 'No Prazo',
  InProgress = 'Em Andamento',
  Delayed = 'Atrasado',
}

export interface PaymentInstallment {
  id: number;
  contractId: number;
  clientName: string;
  projectName: string;
  installment: string;
  dueDate: Date;
  value: number;
  status: 'Pendente' | 'Pago em dia' | 'Pago com atraso';
  paymentDate?: Date;
}


export interface AttentionPoint {
  clientName: string;
  description: string;
  daysRemaining: number;
  // Fix: Added 'payment' to the union type to allow for overdue payment attention points.
  type?: 'stage' | 'contract' | 'payment';
}

export interface Reminder {
  id: number;
  clientId: number;
  clientName: string;
  description: string;
  date: Date;
  completed: boolean;
}

export interface Address {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    cep: string;
}

export interface Attachment {
    name: string;
    type: string;
    content: string; // Base64 encoded content
}

export interface ContractService {
    id: number;
    serviceName: string;
    calculationMethod: 'metragem' | 'hora' | 'manual';
    area: string;
    hours: string;
    value: string;
}

export interface Contract {
    id: number;
    clientName: string;
    projectName: string;
    totalValue: number;
    status: 'Ativo' | 'Concluído' | 'Cancelado';
    date: Date;
    durationMonths: number;
    clientAddress: Address;
    projectAddress: Address;
    downPayment: number;
    installments: number;
    installmentValue: number;
    serviceType: string;
    attachments?: {
        signedContract: Attachment[];
        workFiles: Attachment[];
        sitePhotos: Attachment[];
    };
    services: ContractService[];
    discountType: string;
    discountValue: number;
    mileageDistance?: number;
    mileageCost?: number;
    techVisits?: {
        enabled: boolean;
        quantity: number;
        totalValue: number;
    };
    downPaymentDate: Date;
    firstInstallmentDate: Date;
}

export interface ProjectStage {
    id: number;
    name: string;
    durationWorkDays: number;
    startDate?: string;
    deadline?: string;
    completionDate?: string;
}

export interface ProjectSchedule {
    id: number;
    contractId: number;
    projectName: string;
    clientName: string;
    startDate: string;
    stages: ProjectStage[];
}

export interface StageProgress {
    name: string;
    status: 'completed' | 'in_progress' | 'pending';
}

export interface ProjectProgress {
    contractId: number;
    projectName: string;
    clientName: string;
    stages: StageProgress[];
}

export interface GanttStage {
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'completed' | 'in_progress' | 'pending';
  progress: number; // Percentage 0-100
}

export interface GanttProject {
  contractId: number;
  projectName: string;
  clientName: string;
  stages: GanttStage[];
  schedule: ProjectSchedule; // Include original schedule for editing
  daysRemaining?: number;
}

export interface ServicePrice {
  id: number;
  name: string;
  price?: number;
  unit: 'm²' | 'hora' | 'un' | 'mês';
}

export interface PriceTier {
  id: number;
  range: string;
  price: number;
}