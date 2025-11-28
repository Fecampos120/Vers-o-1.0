
import React, { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, XIcon } from './Icons';
import { ServicePrice, PriceTier, AppData, ProjectStageTemplateItem } from '../types';

// Generic type for items in sections
type SettingItem = ServicePrice | PriceTier | ProjectStageTemplateItem;

interface SettingSectionProps {
  title: string;
  description: string;
  items: SettingItem[];
  onAdd?: () => void; // Made optional
  onEdit: (item: SettingItem) => void;
  onDelete?: (id: number) => void; // Made optional
  renderItem: (item: SettingItem) => React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, description, items, onAdd, onEdit, onDelete, renderItem }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
        <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="space-y-3">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                        {renderItem(item)}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <button 
                                onClick={() => onEdit(item)}
                                disabled={(item as ServicePrice).name === 'Gerenciamento de Obras'}
                                className="p-1 text-slate-400 hover:text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed"
                                aria-label="Editar"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            {onDelete && (
                                <button onClick={() => onDelete(item.id)} className="p-1 text-slate-400 hover:text-red-600" aria-label="Excluir"><TrashIcon className="w-5 h-5" /></button>
                            )}
                        </div>
                    </div>
                ))}
                {onAdd && (
                    <button onClick={onAdd} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 pt-2">
                       <PlusIcon className="w-5 h-5 mr-1" /> Adicionar
                    </button>
                )}
            </div>
        </div>
    </div>
);

interface SettingsProps {
    appData: AppData;
    setAppData: React.Dispatch<React.SetStateAction<AppData>>;
}

const Settings: React.FC<SettingsProps> = ({ appData, setAppData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<{key: keyof AppData, title: string} | null>(null);
  const [editingItem, setEditingItem] = useState<SettingItem | null>(null);
  const [formData, setFormData] = useState<Partial<SettingItem>>({});

  const sections: { [key in keyof AppData]?: any } = {
    servicePrices: {
      title: 'Tipo de Serviço',
      description: 'Configure os serviços que você oferece e seus preços base.',
      fields: ['name', 'price', 'unit'],
      labels: { name: 'Nome do Serviço', price: 'Preço (Opcional)', unit: 'Unidade'},
      render: (item: ServicePrice) => (
          <div>
              <p className="font-medium text-slate-700">{item.name}</p>
              <p className="text-sm text-slate-500">
                {typeof item.price === 'number'
                    ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)} / ${item.unit}`
                    : item.name === 'Medição e Planta Baixa' 
                        ? 'Preço configurado por faixas de m²'
                        : 'Valor a definir por projeto'
                }
              </p>
          </div>
      )
    },
    hourlyRates: {
      title: 'Taxa por Hora',
      description: 'Defina valores para serviços cobrados por hora.',
      fields: ['name', 'price'],
      labels: { name: 'Nome da Taxa', price: 'Preço por Hora'},
       render: (item: ServicePrice) => (
          <div>
              <p className="font-medium text-slate-700">{item.name}</p>
              <p className="text-sm text-slate-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)} / hora</p>
          </div>
      )
    },
    measurementTiers: {
      title: 'Medição e Planta Baixa',
      description: 'Preços fixos com base na área total.',
      fields: ['range', 'price'],
      labels: { range: 'Faixa (Ex: 0 a 100 m²)', price: 'Preço Fixo'},
      render: (item: PriceTier) => (
          <div>
              <p className="font-medium text-slate-700">{item.range}</p>
              <p className="text-sm text-slate-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
          </div>
      )
    },
    extraTiers: {
      title: 'Acréscimos (Elétrica/Hidráulica/Forro)',
      description: 'Valores adicionais por pontos extras.',
      fields: ['range', 'price'],
      labels: { range: 'Faixa (Ex: 0 a 100 m²)', price: 'Preço Fixo'},
      render: (item: PriceTier) => (
           <div>
              <p className="font-medium text-slate-700">{item.range}</p>
              <p className="text-sm text-slate-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
          </div>
      )
    },
    projectStagesTemplate: {
      title: 'Grade de Etapas Padrão',
      description: 'Edite ou adicione etapas que servirão como modelo para novos projetos. A ordem é reajustada automaticamente ao salvar.',
      fields: ['sequence', 'name', 'durationWorkDays'],
      labels: { sequence: 'Ordem', name: 'Nome da Etapa', durationWorkDays: 'Duração (dias úteis)'},
      render: (item: ProjectStageTemplateItem) => (
          <div className="flex items-center space-x-4 flex-grow">
              <span className="font-bold text-slate-500 w-6 text-center">{item.sequence}</span>
              <div className="border-l border-slate-200 pl-4">
                  <p className="font-medium text-slate-700">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.durationWorkDays} dia(s) útil(eis)</p>
              </div>
          </div>
      )
    },
  };

  const openModal = (sectionKey: keyof AppData, item: SettingItem | null = null) => {
    setCurrentSection({ key: sectionKey, title: sections[sectionKey]!.title});
    setEditingItem(item);
    if (item) {
        setFormData({ ...item });
    } else if (sectionKey === 'projectStagesTemplate') {
        const lastItem = [...appData.projectStagesTemplate].sort((a,b) => a.sequence - b.sequence).pop();
        const nextSequence = lastItem ? lastItem.sequence + 1 : 1;
        setFormData({ sequence: nextSequence });
    } else {
        setFormData({});
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSection(null);
    setEditingItem(null);
    setFormData({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: (name === 'price' || name === 'durationWorkDays' || name === 'sequence') ? (value === '' ? undefined : parseFloat(value)) : value }));
  };

  const handleSave = () => {
    if (!currentSection) return;
    const sectionKey = currentSection.key;

    setAppData(prevData => {
        const currentItems = [...(prevData[sectionKey] as SettingItem[])] || [];
        let intermediateItems;
        if (editingItem) {
            intermediateItems = currentItems.map(item => item.id === editingItem.id ? { ...item, ...formData } : item);
        } else {
            let newItem: any = { id: Date.now(), ...formData };
            if (sectionKey === 'hourlyRates') {
                newItem.unit = 'hora';
            }
            intermediateItems = [...currentItems, newItem];
        }
        
        let finalItems = intermediateItems;
        if (sectionKey === 'projectStagesTemplate') {
            finalItems = (intermediateItems as ProjectStageTemplateItem[])
                .sort((a, b) => (a.sequence || 999) - (b.sequence || 999))
                .map((item, index) => ({ ...item, sequence: index + 1 }));
        }

        return { ...prevData, [sectionKey]: finalItems };
    });
    closeModal();
  };

  const handleDelete = (sectionKey: keyof AppData, id: number) => {
      if(window.confirm('Tem certeza que deseja excluir?')) {
          setAppData(prevData => {
            const currentItems = [...(prevData[sectionKey] as SettingItem[])] || [];
            const newItems = currentItems.filter(item => item.id !== id);
            return { ...prevData, [sectionKey]: newItems };
          });
      }
  };

  return (
    <div className="space-y-8">
      <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="mt-1 text-blue-100">
          Personalize os valores padrão e modelos do sistema.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Render Dynamic Sections */}
          {(Object.keys(sections) as (keyof AppData)[]).map(key => {
              const sectionConfig = sections[key];
              const items = appData[key] as SettingItem[];
              
              return (
                  <SettingSection
                    key={key}
                    title={sectionConfig.title}
                    description={sectionConfig.description}
                    items={items}
                    onAdd={() => openModal(key)}
                    onEdit={(item) => openModal(key, item)}
                    onDelete={(id) => handleDelete(key, id)}
                    renderItem={sectionConfig.render}
                  />
              );
          })}
      </div>

      {/* Modal Form */}
      {isModalOpen && currentSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">{editingItem ? 'Editar' : 'Adicionar'} {currentSection.title}</h3>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="p-6 space-y-4">
                        {(sections[currentSection.key].fields as string[]).map(field => (
                            <div key={field}>
                                <label htmlFor={field} className="block text-sm font-medium text-slate-700">
                                    {sections[currentSection.key].labels[field] || field}
                                </label>
                                <input
                                    type={field === 'name' || field === 'range' || field === 'unit' ? 'text' : 'number'}
                                    step={field === 'price' ? '0.01' : '1'}
                                    id={field}
                                    name={field}
                                    value={(formData as any)[field] ?? ''}
                                    onChange={handleFormChange}
                                    disabled={field === 'unit' && currentSection.key === 'hourlyRates'}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 disabled:bg-slate-100"
                                    required
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-4 p-4 bg-slate-50 rounded-b-lg">
                        <button type="button" onClick={closeModal} className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
                        <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
