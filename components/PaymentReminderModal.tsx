
import React, { useState, useEffect } from 'react';
import { PaymentInstallment } from '../types';
import { XIcon, SparklesIcon } from './Icons';
import { GoogleGenAI } from "@google/genai";


interface PaymentReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    installment: PaymentInstallment | null;
}

const formatCurrencyModal = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDateModal = (date: Date) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date));

const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({ isOpen, onClose, installment }) => {
    const [message, setMessage] = useState('');
    const [tone, setTone] = useState<'Amigável' | 'Formal' | 'Urgente'>('Amigável');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (installment) {
            const isLate = new Date(installment.dueDate) < new Date() && installment.status === 'Pendente';
            const introMessage = isLate 
                ? `Olá ${installment.clientName}, tudo bem?\n\nVerificamos que a parcela abaixo, referente ao seu projeto "${installment.projectName}", está em atraso.`
                : `Olá ${installment.clientName}, tudo bem?\n\nEste é um lembrete amigável sobre a próxima parcela do seu projeto "${installment.projectName}".`;

            const defaultMessage = `${introMessage}\n\nDetalhes da Parcela:\n- Parcela: ${installment.installment}\n- Vencimento: ${formatDateModal(installment.dueDate)}\n- Valor: ${formatCurrencyModal(installment.value)}\n\nSe o pagamento já foi efetuado, por favor, desconsidere esta mensagem.\n\nQualquer dúvida, estou à disposição!\n\nAtenciosamente,\nErica Battelli`;
            setMessage(defaultMessage);
        }
    }, [installment]);

    const handleGenerateMessage = async () => {
        if (!installment) return;
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const isLate = new Date(installment.dueDate) < new Date() && installment.status === 'Pendente';
            const prompt = `Aja como um assistente para um arquiteto. Escreva uma mensagem de cobrança para um cliente.
**Instruções:**
- A mensagem deve ser profissional e clara.
- Adapte a mensagem para o tom: "${tone}".
- ${isLate ? `A parcela está ATRASADA.` : `Este é um lembrete de uma parcela que vai vencer.`}
- Não invente informações. Use apenas os dados fornecidos.
- A mensagem final deve ser apenas o texto da mensagem, sem introduções como "Aqui está a mensagem:".

**Dados:**
- Nome do Cliente: ${installment.clientName}
- Nome do Projeto: ${installment.projectName}
- Número da Parcela: ${installment.installment}
- Data de Vencimento: ${formatDateModal(installment.dueDate)}
- Valor da Parcela: ${formatCurrencyModal(installment.value)}
- Assinatura: Erica Battelli`;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            
            setMessage(response.text);

        } catch (error) {
            console.error("Error generating message:", error);
            alert("Ocorreu um erro ao gerar a mensagem. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    if (!isOpen || !installment) return null;

    const handleSendWhatsApp = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        onClose();
    };

    const handleSendEmail = () => {
        const clientEmail = 'cliente@email.com'; 
        const subject = `Lembrete de Pagamento - ${installment.projectName}`;
        const mailtoUrl = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.location.href = mailtoUrl;
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-slate-800">Enviar Lembrete de Pagamento</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <p><span className="font-semibold text-slate-600">Cliente:</span> {installment.clientName}</p>
                        <p><span className="font-semibold text-slate-600">Projeto:</span> {installment.projectName}</p>
                    </div>

                     <div className="p-3 bg-slate-50 rounded-md border">
                        <label htmlFor="tone-select" className="block text-sm font-medium text-slate-700 mb-2">Gerar Mensagem com IA</label>
                        <div className="flex items-center space-x-2">
                           <span className="text-sm text-slate-600">Tom:</span>
                            <select
                                id="tone-select"
                                value={tone}
                                onChange={(e) => setTone(e.target.value as any)}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2 bg-white"
                            >
                                <option>Amigável</option>
                                <option>Formal</option>
                                <option>Urgente</option>
                            </select>
                            <button
                                onClick={handleGenerateMessage}
                                disabled={isGenerating}
                                className="flex items-center justify-center px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400"
                            >
                                {isGenerating ? (
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <SparklesIcon className="w-4 h-4 mr-2" />
                                )}
                                Gerar
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="reminder-message" className="block text-sm font-medium text-slate-700 mb-1">Mensagem do Lembrete</label>
                        <textarea
                            id="reminder-message"
                            rows={10}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-4 p-4 bg-slate-50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
                    <button type="button" onClick={handleSendEmail} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700">Enviar por E-mail</button>
                    <button type="button" onClick={handleSendWhatsApp} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">Enviar por WhatsApp</button>
                </div>
            </div>
        </div>
    );
};

export default PaymentReminderModal;
