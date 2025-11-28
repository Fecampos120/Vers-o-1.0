
import React, { useState, useCallback, useMemo } from 'react';
import { ProjectStage, ProjectSchedule, Contract, GanttProject, GanttStage } from '../types';
import { GANTT_STAGES_CONFIG } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';


// Helper function to add working days to a date, skipping weekends.
const addWorkDays = (startDate: Date, days: number): Date => {
    const newDate = new Date(startDate.valueOf());
    let addedDays = 0;
    while (addedDays < days) {
        newDate.setDate(newDate.getDate() + 1);
        const dayOfWeek = newDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
            addedDays++;
        }
    }
    return newDate;
};

// Formats a date string (YYYY-MM-DD) to DD/MM/YYYY for display.
const formatDateForDisplay = (dateString: string | undefined | Date): string => {
    if (!dateString) return '--/--/----';
    const date = typeof dateString === 'string' ? new Date(`${dateString}T00:00:00`) : dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};


// Determines the status chip for a given stage inside the editor modal
const getEditorStatus = (stage: ProjectStage) => {
    if (stage.completionDate) {
        return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Concluído</span>;
    }
    if (stage.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(stage.deadline);
        // Adjust for timezone when comparing dates from inputs
        deadline.setMinutes(deadline.getMinutes() + deadline.getTimezoneOffset());
        if (deadline < today) {
            return <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Atrasado</span>;
        }
    }
    return <span className="px-2 py-1 text-xs font-medium text-slate-800 bg-slate-100 rounded-full">Pendente</span>;
};


// The main component for editing a single project schedule.
const ScheduleEditor: React.FC<{
    schedule: ProjectSchedule;
    onSave: (schedule: ProjectSchedule) => void;
    onCancel: () => void;
}> = ({ schedule: initialSchedule, onSave, onCancel }) => {
    const [schedule, setSchedule] = useState<ProjectSchedule>(initialSchedule);

    // Core function to recalculate all stage dates based on dependencies.
    const runRecalculation = useCallback((stages: ProjectStage[], projectStartDate: string): ProjectStage[] => {
        if (!projectStartDate) return stages;

        const calculatedStages: ProjectStage[] = [];
        let lastDate = new Date(projectStartDate);
        // Adjust for timezone offset from date input
        lastDate.setMinutes(lastDate.getMinutes() + lastDate.getTimezoneOffset());

        stages.forEach((stage, index) => {
            let currentStageStartDate: Date;

            if (index > 0) {
                const prevStage = calculatedStages[index - 1];
                const prevStageEndDate = prevStage.completionDate ? new Date(prevStage.completionDate) : new Date(prevStage.deadline!);
                 // Adjust for timezone offset
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
    }, []);
    
     // Recalculate everything when the main project start date changes.
    const handleProjectStartDateChange = (newStartDate: string) => {
        setSchedule(prev => {
            const recalculatedStages = runRecalculation(prev.stages, newStartDate);
            return { ...prev, startDate: newStartDate, stages: recalculatedStages };
        });
    };

    // Generic handler for changes to any field within a stage.
    const handleStageChange = (stageId: number, field: keyof ProjectStage, value: any) => {
        const updatedStages = schedule.stages.map(s =>
            s.id === stageId ? { ...s, [field]: value } : s
        );
        const finalStages = runRecalculation(updatedStages, schedule.startDate);
        setSchedule(prev => ({ ...prev, stages: finalStages }));
    };
    
    // Specific handler for the completion checkbox.
    const handleToggleCompletion = (stageId: number, isChecked: boolean) => {
        const completionDate = isChecked ? new Date().toISOString().split('T')[0] : undefined;
        
        const updatedStages = schedule.stages.map(s => 
            s.id === stageId ? { ...s, completionDate: completionDate } : s
        );
        const finalStages = runRecalculation(updatedStages, schedule.startDate);
        setSchedule(prev => ({ ...prev, stages: finalStages }));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                 <h2 className="text-xl font-semibold text-slate-800 mb-4 sm:mb-0">Cronograma do Projeto: <span className="font-bold text-blue-600">{schedule.projectName}</span></h2>
                 <div className="flex items-center space-x-4">
                    <button onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button onClick={() => onSave(schedule)} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">Salvar</button>
                 </div>
            </div>
             <div className="mb-6 max-w-xs">
                <label htmlFor="project-start-date" className="block text-sm font-medium text-slate-700">Data de Início Geral do Projeto</label>
                <input
                    type="date"
                    id="project-start-date"
                    value={schedule.startDate || ''}
                    onChange={(e) => handleProjectStartDateChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left table-fixed min-w-[1000px]">
                <thead className="border-b-2 border-slate-200">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[25%]">Etapa</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[100px] text-center">Duração (dias)</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[160px]">Início Previsto</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[160px]">Prazo Final</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[100px] text-center">Concluído</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[160px]">Data de Conclusão</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[120px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.stages.map((stage) => (
                    <tr key={stage.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="p-3 font-medium text-slate-800 align-middle">{stage.name}</td>
                      <td className="p-3 align-middle">
                         <input 
                            type="number" 
                            value={stage.durationWorkDays} 
                            onChange={(e) => handleStageChange(stage.id, 'durationWorkDays', e.target.value === '' ? 0 : parseInt(e.target.value, 10))} 
                            className="block w-20 mx-auto rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2 text-center" 
                            min="0"
                         />
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap align-middle">
                        <input
                            type="date"
                            value={stage.startDate || ''}
                            onChange={(e) => handleStageChange(stage.id, 'startDate', e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2"
                        />
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap align-middle font-medium">{formatDateForDisplay(stage.deadline)}</td>
                      <td className="p-3 text-center align-middle">
                        <input 
                            type="checkbox" 
                            checked={!!stage.completionDate} 
                            onChange={(e) => handleToggleCompletion(stage.id, e.target.checked)} 
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap align-middle">
                         <input
                            type="date"
                            value={stage.completionDate || ''}
                            onChange={(e) => handleStageChange(stage.id, 'completionDate', e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2"
                        />
                      </td>
                      <td className="p-3 align-middle">{getEditorStatus(stage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
    )
}

interface ProgressProps {
    schedules: ProjectSchedule[];
    setSchedules: (schedules: ProjectSchedule[]) => void;
    contracts: Contract[];
}

interface PlannerTask {
    clientName: string;
    stageName: string;
    status: 'completed' | 'late' | 'on_time';
}

const Progress: React.FC<ProgressProps> = ({ schedules, setSchedules, contracts }) => {
    type Mode = 'gantt' | 'edit' | 'planner';
    type DeadlineFilter = 'all' | 'expiring' | 'late';
    
    const [mode, setMode] = useState<Mode>('gantt');
    const [currentSchedule, setCurrentSchedule] = useState<ProjectSchedule | null>(null);
    const [filterStage, setFilterStage] = useState<string>('all');
    const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
    
    const [plannerDate, setPlannerDate] = useState(new Date());
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);


    const ganttProjects = useMemo((): GanttProject[] => {
        const stageMapping: { [key: string]: string[] } = {
            'Briefing': ['Reunião de Briefing', 'Medição'],
            'Layout': ['Apresentação do Layout Planta Baixa', 'Revisão 01 (Planta Baixa)', 'Revisão 02 (Planta Baixa)', 'Revisão 03 (Planta Baixa)'],
            '3D': ['Apresentação de 3D', 'Revisão 01 (3D)', 'Revisão 02 (3D)', 'Revisão 03 (3D)'],
            'Executivo': ['Executivo'],
            'Entrega': ['Entrega'],
        };
        
        const activeContracts = contracts.filter(c => c.status === 'Ativo');
        const activeSchedules = schedules.filter(s => activeContracts.some(c => c.id === s.contractId));
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return activeSchedules.map(schedule => {
            let daysRemaining: number | undefined;

            const ganttStages = GANTT_STAGES_CONFIG.map(ganttStageConfig => {
                const detailedStageNames = stageMapping[ganttStageConfig.name] || [];
                const relevantStages = schedule.stages.filter(s => detailedStageNames.includes(s.name));
                
                if (relevantStages.length === 0) {
                    return { name: ganttStageConfig.name, startDate: new Date(), endDate: new Date(), status: 'pending', progress: 0 } as GanttStage;
                }

                const completedCount = relevantStages.filter(s => s.completionDate).length;
                const progress = (completedCount / relevantStages.length) * 100;

                let status: GanttStage['status'] = 'pending';
                if (progress === 100) {
                    status = 'completed';
                } else if (progress > 0 || (relevantStages[0].startDate && new Date(`${relevantStages[0].startDate}T00:00:00`) <= today)) {
                    status = 'in_progress';
                }

                if (status === 'in_progress' && daysRemaining === undefined) {
                    const currentDetailedStage = relevantStages.find(s => !s.completionDate);
                    if (currentDetailedStage?.deadline) {
                        const deadline = new Date(`${currentDetailedStage.deadline}T00:00:00`);
                        daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    }
                }

                // Determine date to show
                const startDate = relevantStages[0].startDate ? new Date(`${relevantStages[0].startDate}T00:00:00`) : new Date();
                
                // For the endDate, if in progress, we want the deadline of the *current active* sub-stage for display purposes
                // If completed, the last completion date. If pending, the last deadline.
                let endDate = new Date();
                
                if (status === 'in_progress') {
                     const activeSubStage = relevantStages.find(s => !s.completionDate);
                     if (activeSubStage && activeSubStage.deadline) {
                         endDate = new Date(`${activeSubStage.deadline}T00:00:00`);
                     } else if (relevantStages[relevantStages.length - 1].deadline) {
                         endDate = new Date(`${relevantStages[relevantStages.length - 1].deadline}T00:00:00`);
                     }
                } else {
                    if (relevantStages[relevantStages.length - 1].deadline) {
                        endDate = new Date(`${relevantStages[relevantStages.length - 1].deadline}T00:00:00`);
                    }
                }

                return {
                    name: ganttStageConfig.name,
                    startDate,
                    endDate,
                    status,
                    progress,
                };
            });
            
            return {
                contractId: schedule.contractId,
                clientName: schedule.clientName,
                projectName: schedule.projectName,
                schedule,
                stages: ganttStages,
                daysRemaining,
            };
        });
    }, [schedules, contracts]);
    
    const filteredProjects = useMemo(() => {
        return ganttProjects.filter(project => {
            // Stage filter
            const stageMatch = filterStage === 'all' || project.stages.some(s => s.name === filterStage && s.status === 'in_progress');
            if (!stageMatch) return false;

            // Deadline filter
            if (deadlineFilter === 'all') return true;
            if (deadlineFilter === 'expiring') {
                return project.daysRemaining !== undefined && project.daysRemaining >= 0 && project.daysRemaining <= 7;
            }
            if (deadlineFilter === 'late') {
                return project.daysRemaining !== undefined && project.daysRemaining < 0;
            }
            return true;
        });
    }, [ganttProjects, filterStage, deadlineFilter]);

    const handleEdit = (schedule: ProjectSchedule) => {
        setCurrentSchedule(JSON.parse(JSON.stringify(schedule))); // Deep copy for safe editing
        setMode('edit');
    };

    const handleSave = (scheduleToSave: ProjectSchedule) => {
        const newSchedules = schedules.map(s => s.id === scheduleToSave.id ? scheduleToSave : s);
        setSchedules(newSchedules);
        setMode('gantt');
        setCurrentSchedule(null);
    };

    const handleCancel = () => {
        setMode('gantt');
        setCurrentSchedule(null);
    };

    // Planner specific logic
    const handleMonthChange = (offset: number) => {
        setPlannerDate(current => {
            const newDate = new Date(current);
            newDate.setDate(1); // Avoid month-end issues
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
        setSelectedWeekIndex(0);
    };

    const weeksInMonth = useMemo(() => {
        const date = plannerDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const grid: Date[] = [];
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

        for (let i = 0; i < 42; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            grid.push(day);
        }

        const finalWeeks: Date[][] = [];
        for (let i = 0; i < grid.length; i += 7) {
            finalWeeks.push(grid.slice(i, i + 7));
        }
        return finalWeeks;
    }, [plannerDate]);

    if (mode === 'edit' && currentSchedule) {
        return <ScheduleEditor schedule={currentSchedule} onSave={handleSave} onCancel={handleCancel} />;
    }

    const renderPlanner = () => {
        const currentWeek = weeksInMonth[selectedWeekIndex] || [];
        
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-lg font-semibold text-slate-800 capitalize">
                            {plannerDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex space-x-2">
                            <button onClick={() => handleMonthChange(-1)} className="p-1 rounded hover:bg-slate-100"><ChevronLeftIcon className="w-5 h-5 text-slate-500"/></button>
                            <button onClick={() => handleMonthChange(1)} className="p-1 rounded hover:bg-slate-100"><ChevronRightIcon className="w-5 h-5 text-slate-500"/></button>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        {weeksInMonth.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedWeekIndex(idx)}
                                className={`px-3 py-1 text-sm rounded-full ${selectedWeekIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Sem {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <div key={d} className="text-center text-sm font-semibold text-slate-500 mb-2">{d}</div>
                    ))}
                    
                    {currentWeek.map((day, dayIdx) => {
                        const isToday = new Date().toDateString() === day.toDateString();
                        const dateStr = day.toISOString().split('T')[0];
                        
                        // Find tasks for this day
                        const dayTasks: PlannerTask[] = [];
                        schedules.forEach(schedule => {
                            schedule.stages.forEach(stage => {
                                if(stage.completionDate) return;
                                if(stage.deadline === dateStr) {
                                    dayTasks.push({
                                        clientName: schedule.clientName,
                                        stageName: stage.name,
                                        status: stage.deadline < new Date().toISOString().split('T')[0] ? 'late' : 'on_time'
                                    });
                                }
                            });
                        });

                        return (
                            <div key={dayIdx} className={`min-h-[120px] border rounded-lg p-2 ${isToday ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                                <div className="text-right mb-2">
                                    <span className={`text-sm font-medium ${day.getMonth() !== plannerDate.getMonth() ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {day.getDate()}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {dayTasks.map((task, taskIdx) => (
                                        <div key={taskIdx} className={`text-xs p-1 rounded border ${task.status === 'late' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                            <p className="font-bold truncate">{task.clientName}</p>
                                            <p className="truncate">{task.stageName}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };
    
    // Helper to determine status display logic for the table cells
    const getStatusInfo = (stage: GanttStage) => {
        if (stage.status === 'completed') {
            return { label: 'CONCLUÍDO', color: 'bg-green-100 text-green-800', barColor: 'bg-green-500', date: '' };
        }
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (stage.status === 'in_progress') {
             const diffTime = stage.endDate.getTime() - today.getTime();
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

             if (diffDays < 0) {
                 return { label: 'ATRASADO', color: 'bg-red-100 text-red-800', barColor: 'bg-red-500', date: `${Math.abs(diffDays)} dia(s)` };
             } else if (diffDays <= 7) {
                 return { label: 'PRÓX. VENCIMENTO', color: 'bg-yellow-100 text-yellow-800', barColor: 'bg-yellow-500', date: diffDays === 0 ? 'Vence Hoje' : `Restam ${diffDays} dia(s)` };
             } else {
                 return { label: 'PENDENTE', color: 'bg-slate-100 text-slate-800', barColor: 'bg-slate-300', date: '' };
             }
        }
        
        return { label: 'PENDENTE', color: 'bg-slate-100 text-slate-600', barColor: 'bg-slate-200', date: '' };
    };

    return (
        <div className="space-y-8">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Progresso dos Projetos</h1>
                        <p className="mt-1 text-blue-100">
                            Acompanhe e edite o cronograma de cada projeto.
                        </p>
                    </div>
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 flex justify-between items-center">
                <div className="flex p-1 bg-slate-100 rounded-lg m-2">
                    <button
                        onClick={() => setMode('gantt')}
                        className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'gantt' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                        Visão Geral (Tabela)
                    </button>
                    <button
                        onClick={() => setMode('planner')}
                        className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'planner' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                        Planner Semanal
                    </button>
                </div>
            </div>

            {mode === 'gantt' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">Visão Geral dos Cronogramas</h2>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-slate-600">Filtrar por etapa:</span>
                                <select value={filterStage} onChange={e => setFilterStage(e.target.value)} className="border-slate-300 rounded-md text-sm h-9 pl-2 pr-8 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="all">Mostrar Tudo</option>
                                    {GANTT_STAGES_CONFIG.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="mb-6 flex space-x-6 text-sm text-slate-600">
                             <span className="font-medium">Filtrar por prazo:</span>
                             <label className="flex items-center space-x-2 cursor-pointer">
                                 <input type="radio" name="deadlineFilter" value="all" checked={deadlineFilter === 'all'} onChange={() => setDeadlineFilter('all')} className="text-blue-600 focus:ring-blue-500" />
                                 <span>Todos</span>
                             </label>
                             <label className="flex items-center space-x-2 cursor-pointer">
                                 <input type="radio" name="deadlineFilter" value="expiring" checked={deadlineFilter === 'expiring'} onChange={() => setDeadlineFilter('expiring')} className="text-blue-600 focus:ring-blue-500" />
                                 <span>Próximos do Vencimento</span>
                             </label>
                             <label className="flex items-center space-x-2 cursor-pointer">
                                 <input type="radio" name="deadlineFilter" value="late" checked={deadlineFilter === 'late'} onChange={() => setDeadlineFilter('late')} className="text-blue-600 focus:ring-blue-500" />
                                 <span>Atrasados</span>
                             </label>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                        <th className="p-4 w-[20%]">Projeto</th>
                                        {GANTT_STAGES_CONFIG.map(stage => (
                                            <th key={stage.name} className="p-4 text-center">{stage.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProjects.map(project => (
                                        <tr key={project.contractId} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 align-top">
                                                <button onClick={() => handleEdit(project.schedule)} className="text-left group">
                                                    <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-sm">{project.projectName}</p>
                                                    <p className="text-xs text-slate-500 mb-1">{project.clientName}</p>
                                                    {project.daysRemaining !== undefined && (
                                                        <p className={`text-xs font-bold ${project.daysRemaining < 0 ? 'text-red-500' : 'text-orange-500'}`}>
                                                            {project.daysRemaining < 0 ? `${Math.abs(project.daysRemaining)} dia(s) atraso` : `${project.daysRemaining} dia(s) restante(s)`}
                                                        </p>
                                                    )}
                                                </button>
                                            </td>
                                            {GANTT_STAGES_CONFIG.map(stageConfig => {
                                                const stageData = project.stages.find(s => s.name === stageConfig.name);
                                                if (!stageData) return <td key={stageConfig.name} className="p-4"></td>;
                                                
                                                const info = getStatusInfo(stageData);
                                                
                                                return (
                                                    <td key={stageConfig.name} className="p-4 align-top text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${info.color} mb-2`}>
                                                                {info.label}
                                                            </span>
                                                            {info.label !== 'PENDENTE' && (
                                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2 max-w-[100px]">
                                                                    <div className={`h-full ${info.barColor}`} style={{ width: info.label === 'CONCLUÍDO' ? '100%' : '50%' }}></div>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col text-[10px] text-slate-500">
                                                                <span>Início: {formatDateForDisplay(stageData.startDate)}</span>
                                                                <span>Fim: {formatDateForDisplay(stageData.endDate)}</span>
                                                                {info.date && <span className={`font-bold mt-1 ${info.label === 'ATRASADO' ? 'text-red-600' : 'text-orange-500'}`}>{info.date}</span>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                    {filteredProjects.length === 0 && (
                                        <tr>
                                            <td colSpan={GANTT_STAGES_CONFIG.length + 1} className="p-8 text-center text-slate-500">
                                                Nenhum projeto encontrado com os filtros atuais.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'planner' && renderPlanner()}
        </div>
    );
};

export default Progress;
