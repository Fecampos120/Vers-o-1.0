

import React, { useState, useMemo } from 'react';
import { Partner, Address, Client } from '../types';
import { PARTNER_TYPES } from '../constants';
import { UsersIcon, PencilIcon, TrashIcon } from './Icons';

interface PartnersProps {
    partners: Partner[];
    clients: Client[];
    onAddPartner: (partner: Omit<Partner, 'id'>) => void;
    onUpdatePartner: (partner: Partner) => void;
    onDeletePartner: (id: number) => void;
}

const emptyPartner: Omit<Partner, 'id'> = {
    name: '',
    type: PARTNER_TYPES[0],
    contactPerson: '',
    phone: '',
    email: '',
    address: { street: '', number: '', complement: '', district: '', city: '', state: '', cep: '' },
    clientIds: []
};

const Partners: React.FC<PartnersProps> = ({ partners, clients, onAddPartner, onUpdatePartner, onDeletePartner }) => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [formData, setFormData] = useState<Omit<Partner, 'id'> | Partner>(emptyPartner);
    const [filterType, setFilterType] = useState('Todos');

    const filteredPartners = useMemo(() => {
        if (filterType === 'Todos') return partners;
        return partners.filter(p => p.type === filterType);
    }, [partners, filterType]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address!,
                [name]: value,
            }
        }));
    };
    
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // Fix: Explicitly type `option` as `HTMLOptionElement` to prevent TypeScript from inferring it as `unknown`.
        const selectedOptions = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => Number(option.value));
        setFormData(prev => ({
            ...prev,
            clientIds: selectedOptions
        }));
    };

    const handleEdit = (partner: Partner) => {
        setEditingPartner(partner);
        setFormData(partner);
        setIsFormVisible(true);
    };

    const handleCancel = () => {
        setEditingPartner(null);
        setFormData(emptyPartner);
        setIsFormVisible(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPartner) {
            onUpdatePartner(formData as Partner);
        } else {
            onAddPartner(formData);
        }
        handleCancel();
    };

    return (
        <div className="space-y-8">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Parceiros e Fornecedores</h1>
                <p className="mt-1 text-blue-100">
                    Cadastre e gerencie seus contatos profissionais.
                </p>
            </header>

            {!isFormVisible && (
                <div className="text-right">
                    <button onClick={() => setIsFormVisible(true)} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">
                        + Cadastrar Novo Parceiro
                    </button>
                </div>
            )}
            
            {isFormVisible && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">{editingPartner ? 'Editar Parceiro' : 'Cadastrar Novo Parceiro'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="border-b border-slate-200 pb-6">
                             <h3 className="text-base font-medium text-slate-700">Informações Principais</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nome do Fornecedor</label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-slate-600">Tipo de Fornecedor</label>
                                    <select name="type" id="type" value={formData.type} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3">
                                        {PARTNER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="contactPerson" className="block text-sm font-medium text-slate-600">Nome do Contato</label>
                                    <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-slate-600">Telefone</label>
                                    <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-600">E-mail</label>
                                    <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div className="md:col-span-3">
                                    <label htmlFor="clientIds" className="block text-sm font-medium text-slate-600">Clientes Associados</label>
                                    <select 
                                        multiple 
                                        name="clientIds" 
                                        id="clientIds" 
                                        value={formData.clientIds?.map(String) || []} 
                                        onChange={handleMultiSelectChange} 
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-32"
                                    >
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-slate-500">Segure Ctrl (ou Cmd em Mac) para selecionar múltiplos clientes.</p>
                                </div>
                            </div>
                        </div>
                         <div className="border-b border-slate-200 pb-6">
                             <h3 className="text-base font-medium text-slate-700">Endereço</h3>
                             <div className="grid grid-cols-6 gap-4 mt-4">
                                <div className="col-span-6 sm:col-span-3">
                                    <label htmlFor="street" className="block text-sm font-medium text-slate-600">Rua</label>
                                    <input type="text" name="street" id="street" value={formData.address?.street || ''} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div className="col-span-6 sm:col-span-1">
                                    <label htmlFor="number" className="block text-sm font-medium text-slate-600">Número</label>
                                    <input type="text" name="number" id="number" value={formData.address?.number || ''} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <label htmlFor="complement" className="block text-sm font-medium text-slate-600">Complemento</label>
                                    <input type="text" name="complement" id="complement" value={formData.address?.complement || ''} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <label htmlFor="district" className="block text-sm font-medium text-slate-600">Bairro</label>
                                    <input type="text" name="district" id="district" value={formData.address?.district || ''} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <label htmlFor="city" className="block text-sm font-medium text-slate-600">Cidade</label>
                                    <input type="text" name="city" id="city" value={formData.address?.city || ''} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                                </div>
                                 <div className="col-span-6 sm:col-span-1">
                                    <label htmlFor="state" className="block text-sm font-medium text-slate-600">Estado</label>
                                    <input type="text" name="state" id="state" value={formData.address?.state || ''} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                                </div>
                                 <div className="col-span-6 sm:col-span-1">
                                    <label htmlFor="cep" className="block text-sm font-medium text-slate-600">CEP</label>
                                    <input type="text" name="cep" id="cep" value={formData.address?.cep || ''} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={handleCancel} className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
                            <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">{editingPartner ? 'Salvar Alterações' : 'Salvar Parceiro'}</button>
                        </div>
                    </form>
                </div>
            )}
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 mb-2 sm:mb-0">Parceiros Cadastrados</h2>
                    <div>
                        <label htmlFor="filterType" className="block text-sm font-medium text-slate-600">Filtrar por tipo</label>
                        <select id="filterType" value={filterType} onChange={e => setFilterType(e.target.value)} className="mt-1 block w-full sm:w-64 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3">
                            <option>Todos</option>
                            {PARTNER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                </div>
                <div className="space-y-3">
                    {filteredPartners.length > 0 ? filteredPartners.map(partner => (
                        <div key={partner.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div className="flex-1 mb-3 sm:mb-0">
                                <p className="font-bold text-slate-800">{partner.name}</p>
                                <div className="flex flex-wrap items-center text-sm text-slate-500 mt-1 gap-x-4 gap-y-1">
                                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">{partner.type}</span>
                                    {partner.contactPerson && <span>Contato: {partner.contactPerson}</span>}
                                    {partner.phone && <span>Tel: {partner.phone}</span>}
                                </div>
                                {partner.clientIds && partner.clientIds.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-200">
                                        <p className="text-xs font-semibold text-slate-600">Atuando nos projetos de:</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {partner.clientIds.map(clientId => {
                                                const client = clients.find(c => c.id === clientId);
                                                return client ? (
                                                    <span key={clientId} className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                                        {client.name}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-shrink-0 flex items-center space-x-2">
                                <button onClick={() => handleEdit(partner)} className="p-2 text-slate-500 hover:text-blue-600" aria-label="Editar">
                                    <PencilIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => {
                                    if(window.confirm(`Tem certeza que deseja excluir o parceiro "${partner.name}"?`)){
                                        onDeletePartner(partner.id)
                                    }
                                }} className="p-2 text-slate-500 hover:text-red-600" aria-label="Excluir">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-6 text-slate-500">
                            <UsersIcon className="w-12 h-12 mx-auto text-slate-300"/>
                            <p className="mt-2">Nenhum parceiro encontrado.</p>
                            <p className="text-sm">Tente ajustar o filtro ou cadastre um novo parceiro.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Partners;