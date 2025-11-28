
import React, { useState, useMemo } from 'react';
import StatCard from './StatCard';
import { PaymentInstallment } from '../types';
import { ChartBarIcon, ExclamationTriangleIcon, SendIcon } from './Icons';
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

const LatePayments: React.FC<{ installments: PaymentInstallment[] }> = ({ installments }) => {
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);

    const handleOpenReminderModal = (installment: PaymentInstallment) => {
        setSelectedInstallment(installment);
        setIsReminderModalOpen(true);
    };

    const handleCloseReminderModal = () => {
        setSelectedInstallment(null);
        setIsReminderModalOpen(false);
    };

    const lateInstallmentsData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const late = installments
            .filter(inst => inst.status === 'Pendente' && new Date(inst.dueDate) < today)
            .map(inst => {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const diffTime = today.getTime() - dueDate.getTime();
                const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return { ...inst, daysLate };
            })
            .sort((a, b) => b.daysLate - a.daysLate);

        const totalLateAmount = late.reduce((sum, inst) => sum + inst.value, 0);
        
        return {
            lateInstallments: late,
            totalLateAmount,
            lateCount: late.length,
        };
    }, [installments]);
    
    return (
        <div className="space-y-8">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Parcelas Atrasadas</h1>
                <p className="mt-1 text-blue-100">
                    Visualize e gerencie todas as parcelas com pagamento pendente.
                </p>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Valor Total Atrasado"
                    value={formatCurrency(lateInstallmentsData.totalLateAmount)}
                    icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-500" />}
                />
                <StatCard
                    title="Qtd. Parcelas Atrasadas"
                    value={lateInstallmentsData.lateCount.toString()}
                    icon={<ChartBarIcon className="w-6 h-6 text-amber-500" />}
                />
            </section>

            <section className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-semibold text-slate-800">Detalhes das Parcelas Atrasadas</h2>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-slate-500">Cliente</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Projeto</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Vencimento</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Dias Atrasados</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Valor</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lateInstallmentsData.lateInstallments.map((payment) => (
                                <tr key={payment.id} className="border-b border-slate-100 last:border-b-0">
                                    <td className="p-3 text-slate-700">{payment.clientName}</td>
                                    <td className="p-3 text-slate-700">{payment.projectName}</td>
                                    <td className="p-3 text-slate-700">{formatDate(new Date(payment.dueDate))}</td>
                                    <td className="p-3 text-red-600 font-medium">{payment.daysLate}</td>
                                    <td className="p-3 text-slate-700">{formatCurrency(payment.value)}</td>
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
                            {lateInstallmentsData.lateInstallments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center p-4 text-slate-500">Nenhuma parcela atrasada no momento.</td>
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

export default LatePayments;