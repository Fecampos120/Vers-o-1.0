
import React, { useState, useMemo } from 'react';
import { Contract, PaymentInstallment } from '../types';
import { ArchitectIcon } from './Icons';

interface ReceiptsProps {
    contracts: Contract[];
    installments: PaymentInstallment[];
}

const Receipts: React.FC<ReceiptsProps> = ({ contracts, installments }) => {
    const [selectedContractId, setSelectedContractId] = useState<string>('');

    const selectedContract = useMemo(() => {
        if (!selectedContractId) return null;
        return contracts.find(c => c.id === parseInt(selectedContractId));
    }, [selectedContractId, contracts]);

    const contractInstallments = useMemo(() => {
        if (!selectedContract) return [];
        return installments
            .filter(i => i.contractId === selectedContract.id)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [selectedContract, installments]);

    const handlePrint = () => {
        window.print();
    };
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date));

    return (
        <>
            <style>{`
                @media print {
                    body > #root > div > aside, .no-print {
                        display: none;
                    }
                    body > #root > div > main {
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        background: white !important;
                    }
                    .printable-area {
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 auto;
                        padding: 0;
                        width: 100%;
                        color: black;
                        font-size: 11pt;
                    }
                    .page-break {
                        page-break-after: always;
                    }
                    @page {
                        margin: 1.5cm;
                    }
                }
            `}</style>
            <div className="space-y-8">
                <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10 no-print">
                    <h1 className="text-3xl font-bold">Recibos e Demonstrativos</h1>
                    <p className="mt-1 text-blue-100">
                        Gere recibos detalhados com discriminação de serviços e cronograma de pagamentos.
                    </p>
                </header>
                
                <div className="bg-white p-6 rounded-xl shadow-lg no-print">
                    <label htmlFor="contract-select" className="block text-sm font-medium text-slate-700">Selecione um Projeto/Contrato</label>
                    <select
                        id="contract-select"
                        value={selectedContractId}
                        onChange={(e) => setSelectedContractId(e.target.value)}
                        className="mt-1 block w-full max-w-md rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                    >
                        <option value="">Selecione...</option>
                        {contracts.map(contract => (
                            <option key={contract.id} value={contract.id}>
                                {contract.projectName} - {contract.clientName}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedContract && (
                    <div>
                        <div className="printable-area bg-white p-10 rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto font-serif relative">
                            {/* Decorative Header Border */}
                            <div className="absolute top-0 left-0 w-full h-3 bg-slate-800 rounded-t-xl print:rounded-none"></div>

                            <header className="flex justify-between items-end border-b-2 border-slate-800 pb-6 mb-8 pt-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-widest">Demonstrativo Financeiro</h1>
                                    <p className="text-slate-600 text-sm mt-1">Recibo e Cronograma de Pagamentos</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end space-x-2 text-slate-800 font-bold text-xl">
                                        <ArchitectIcon className="w-8 h-8" />
                                        <span>STUDIO BATTELLO</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Arquitetura & Interiores</p>
                                    <p className="text-xs text-slate-500">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                                </div>
                            </header>

                            <main className="space-y-8">
                                {/* Dados do Contrato */}
                                <section className="grid grid-cols-2 gap-8">
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 print:bg-transparent print:border-slate-200">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">CONTRATANTE (Cliente)</h3>
                                        <p className="text-lg font-bold text-slate-800">{selectedContract.clientName}</p>
                                        <p className="text-sm text-slate-600 mt-1">
                                            {selectedContract.clientAddress.street}, {selectedContract.clientAddress.number} {selectedContract.clientAddress.complement && `- ${selectedContract.clientAddress.complement}`}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {selectedContract.clientAddress.district} - {selectedContract.clientAddress.city}/{selectedContract.clientAddress.state}
                                        </p>
                                        <p className="text-sm text-slate-600">CEP: {selectedContract.clientAddress.cep}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 print:bg-transparent print:border-slate-200">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">OBJETO (Projeto)</h3>
                                        <p className="text-lg font-bold text-slate-800">{selectedContract.projectName}</p>
                                        <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">Tipo:</span> {selectedContract.serviceType}</p>
                                        <p className="text-sm text-slate-600"><span className="font-semibold">Local da Obra:</span> {selectedContract.projectAddress.street}, {selectedContract.projectAddress.number}</p>
                                        <p className="text-sm text-slate-600">{selectedContract.projectAddress.city}/{selectedContract.projectAddress.state}</p>
                                    </div>
                                </section>

                                {/* Discriminação dos Serviços */}
                                <section>
                                    <h2 className="text-sm font-bold text-slate-800 uppercase border-b-2 border-slate-200 pb-2 mb-4">1. Discriminação dos Serviços Contratados</h2>
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100 text-slate-700 print:bg-slate-100">
                                            <tr>
                                                <th className="py-2 px-3 text-left font-semibold">Serviço</th>
                                                <th className="py-2 px-3 text-center font-semibold">Detalhe de Cálculo</th>
                                                <th className="py-2 px-3 text-right font-semibold">Valor Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 border border-slate-200">
                                            {selectedContract.services.map((service, index) => (
                                                <tr key={index}>
                                                    <td className="py-3 px-3 text-slate-800 font-medium">{service.serviceName}</td>
                                                    <td className="py-3 px-3 text-center text-slate-600">
                                                        {service.calculationMethod === 'metragem' && service.area ? `${service.area} m²` : 
                                                         service.calculationMethod === 'hora' && service.hours ? `${service.hours} Horas Técnicas` : 
                                                         'Valor Fixo / Pacote'}
                                                    </td>
                                                    <td className="py-3 px-3 text-right text-slate-800">{formatCurrency(parseFloat(service.value))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </section>

                                {/* Resumo Financeiro */}
                                <section className="flex justify-end">
                                    <div className="w-1/2 space-y-2">
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>Subtotal Serviços:</span>
                                            <span>{formatCurrency(selectedContract.services.reduce((acc, s) => acc + parseFloat(s.value), 0))}</span>
                                        </div>
                                        {/* Lógica para Exibir Visitas Técnicas OU Deslocamento */}
                                        {selectedContract.techVisits?.enabled ? (
                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>Visitas Técnicas ({selectedContract.techVisits.quantity}x) + Deslocamento:</span>
                                                <span>{formatCurrency(selectedContract.mileageCost || 0)}</span>
                                            </div>
                                        ) : (
                                            (selectedContract.mileageCost || 0) > 0 && (
                                                <div className="flex justify-between text-sm text-slate-600">
                                                    <span>Adicional Deslocamento ({selectedContract.mileageDistance}km):</span>
                                                    <span>{formatCurrency(selectedContract.mileageCost || 0)}</span>
                                                </div>
                                            )
                                        )}

                                        {(selectedContract.discountValue || 0) > 0 && (
                                            <div className="flex justify-between text-sm text-red-600">
                                                <span>Desconto ({selectedContract.discountType}):</span>
                                                <span>- {formatCurrency(selectedContract.discountValue)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold text-slate-900 border-t-2 border-slate-800 pt-2 mt-2">
                                            <span>TOTAL DO CONTRATO:</span>
                                            <span>{formatCurrency(selectedContract.totalValue)}</span>
                                        </div>
                                    </div>
                                </section>

                                {/* Cronograma de Pagamento */}
                                <section>
                                    <h2 className="text-sm font-bold text-slate-800 uppercase border-b-2 border-slate-200 pb-2 mb-4">2. Cronograma de Pagamento e Vencimentos</h2>
                                    <div className="overflow-hidden rounded-lg border border-slate-200">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-800 text-white print:bg-slate-800 print:text-white">
                                                <tr>
                                                    <th className="py-2 px-4 text-left font-semibold">Descrição</th>
                                                    <th className="py-2 px-4 text-left font-semibold">Vencimento</th>
                                                    <th className="py-2 px-4 text-right font-semibold">Valor</th>
                                                    <th className="py-2 px-4 text-center font-semibold">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {contractInstallments.map((inst, idx) => {
                                                    const isPaid = inst.status.includes('Pago');
                                                    return (
                                                        <tr key={inst.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                            <td className="py-3 px-4 text-slate-800 font-medium">
                                                                {inst.installment === 'Entrada' ? 'Entrada / Sinal' : `Parcela ${inst.installment}`}
                                                            </td>
                                                            <td className="py-3 px-4 text-slate-700">
                                                                {formatDate(inst.dueDate)}
                                                            </td>
                                                            <td className="py-3 px-4 text-right text-slate-800 font-bold">
                                                                {formatCurrency(inst.value)}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${
                                                                    isPaid 
                                                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                                                    : 'bg-white text-slate-500 border-slate-300'
                                                                }`}>
                                                                    {inst.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 italic">* Recibo válido somente mediante comprovação bancária para pagamentos via transferência/PIX ou compensação de cheque/boleto.</p>
                                </section>

                                {/* Declaração */}
                                <section className="bg-slate-50 p-6 border border-slate-200 rounded-lg mt-8 print:mt-12 text-center">
                                    <p className="text-slate-700 leading-relaxed text-sm">
                                        Reconhecemos a exatidão dos dados e valores discriminados neste documento, servindo o presente como demonstrativo financeiro do contrato de prestação de serviços de arquitetura firmado entre as partes.
                                    </p>
                                </section>

                                {/* Assinaturas */}
                                <footer className="flex justify-between items-end pt-16 print:pt-20 px-8">
                                    <div className="text-center">
                                        <div className="border-t border-slate-400 w-64 pt-2"></div>
                                        <p className="text-sm font-bold text-slate-800">{selectedContract.clientName}</p>
                                        <p className="text-xs text-slate-500">CONTRATANTE</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="border-t border-slate-400 w-64 pt-2"></div>
                                        <p className="text-sm font-bold text-slate-800">Erica Battelli Agudo Fileto</p>
                                        <p className="text-xs text-slate-500">CONTRATADA</p>
                                    </div>
                                </footer>
                            </main>
                        </div>
                        <div className="text-center mt-6 no-print pb-10">
                            <button 
                                onClick={handlePrint}
                                className="px-8 py-3 border border-transparent rounded-full shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transform transition hover:-translate-y-1"
                            >
                                Imprimir / Salvar PDF
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Receipts;
