
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadIcon, XIcon } from './Icons';
import { AppData, Contract, Attachment, ContractService } from '../types';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
    <h2 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-4">{title}</h2>
    <div className="mt-6 space-y-4">
      {children}
    </div>
  </div>
);

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
  required?: boolean;
  defaultValue?: string | number;
  value?: string | number; // Added to support controlled inputs
  onChange?: React.ChangeEventHandler<HTMLInputElement>; // Added for change handling
}

const FormField: React.FC<FormFieldProps> = ({ label, id, type = 'text', placeholder, className, children, required, defaultValue, value, onChange }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}{required && <span className="text-red-500">*</span>}
    </label>
    {children ? (
       <div className="mt-1">{children}</div>
    ) : (
      <input
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white"
        required={required}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
      />
    )}
  </div>
);

interface FileUploadAreaProps {
  title: string;
  files: File[];
  onFilesAdded: (newFiles: File[]) => void;
  onFileRemoved: (fileToRemove: File) => void;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ title, files, onFilesAdded, onFileRemoved }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            onFilesAdded(Array.from(event.target.files));
            event.target.value = ''; // Allow re-uploading the same file
        }
    };

    const handleClick = () => {
        inputRef.current?.click();
    };
    
    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
    };
    
    const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    };
    
    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            onFilesAdded(Array.from(event.dataTransfer.files));
            event.dataTransfer.clearData();
        }
    };

    return (
        <div className="flex flex-col">
            <input
                type="file"
                ref={inputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
            />
            <div
                onClick={handleClick}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:bg-slate-50 transition-colors h-full"
            >
                <UploadIcon className="w-8 h-8 text-slate-400" />
                <p className="mt-2 text-sm text-slate-600">{title}</p>
                <p className="text-xs text-slate-500">Clique ou arraste para enviar</p>
            </div>
            {files.length > 0 && (
                <div className="mt-2 space-y-1">
                    {files.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex justify-between items-center text-sm bg-slate-100 p-1.5 rounded">
                            <span className="truncate text-slate-700 flex-1 min-w-0" title={file.name}>{file.name}</span>
                            <button type="button" onClick={() => onFileRemoved(file)} className="ml-2 text-slate-400 hover:text-red-600 flex-shrink-0">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


interface NewContractProps {
    appData: AppData;
    onAddContract: (contract: Omit<Contract, 'id'>) => void;
    onUpdateContract: (contract: Contract) => void;
    editingContract: Contract | null;
    onCancel: () => void;
}

const fileToBase64 = (file: File): Promise<Attachment> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            name: file.name,
            type: file.type,
            content: reader.result as string,
        });
        reader.onerror = error => reject(error);
    });
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const NewContract: React.FC<NewContractProps> = ({ appData, onAddContract, onUpdateContract, editingContract, onCancel }) => {
    const isEditing = !!editingContract;
    const MILEAGE_RATE = 1.40;
    const VISIT_BASE_PRICE = 80.00;

    const [isSameAddress, setIsSameAddress] = useState(() => 
        isEditing ? (editingContract.clientAddress.cep === editingContract.projectAddress.cep) : false
    );
    const [contractTypes, setContractTypes] = useState<ContractService[]>(() => 
        isEditing && editingContract.services.length > 0 ? editingContract.services : [
            {
              id: Date.now(),
              serviceName: '',
              calculationMethod: 'metragem',
              area: '',
              hours: '',
              value: '0.00',
            },
        ]
    );
    const [serviceType, setServiceType] = useState(() => isEditing ? editingContract.serviceType : 'Residencial');
    const [durationMonths, setDurationMonths] = useState(() => isEditing ? String(editingContract.durationMonths) : '6');
    
    const [financialInputs, setFinancialInputs] = useState(() => isEditing ? {
        discountType: editingContract.discountType,
        discountValue: String(editingContract.discountValue),
        downPaymentPercentage: String((editingContract.downPayment / editingContract.totalValue) * 100),
        installments: String(editingContract.installments),
    } : {
        discountType: 'Valor (R$)',
        discountValue: '0',
        downPaymentPercentage: '30',
        installments: '0',
    });

    const [mileage, setMileage] = useState(() => isEditing ? {
        enabled: !!editingContract.mileageCost && editingContract.mileageCost > 0 && !editingContract.techVisits?.enabled,
        distance: String(editingContract.mileageDistance || ''),
    } : {
        enabled: false,
        distance: '',
    });
    
    const [techVisits, setTechVisits] = useState(() => isEditing ? {
        enabled: !!editingContract.techVisits?.enabled,
        quantity: String(editingContract.techVisits?.quantity || '1'),
    } : {
        enabled: false,
        quantity: '1',
    });

    const [financials, setFinancials] = useState({
        subtotal: 0,
        total: 0,
        downPayment: 0,
        remaining: 0,
        installmentValue: 0,
        mileageCost: 0, // Now represents Total Extra Costs (Mileage OR Tech Visits)
    });

     const [uploadedFiles, setUploadedFiles] = useState<{
        signedContract: File[];
        workFiles: File[];
        sitePhotos: File[];
    }>({
        signedContract: [],
        workFiles: [],
        sitePhotos: [],
    });
    
    // Date State Management
    const [contractDate, setContractDate] = useState(() => editingContract?.date ? new Date(editingContract.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [downPaymentDate, setDownPaymentDate] = useState(() => editingContract?.downPaymentDate ? new Date(editingContract.downPaymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [firstInstallmentDate, setFirstInstallmentDate] = useState(() => editingContract?.firstInstallmentDate ? new Date(editingContract.firstInstallmentDate).toISOString().split('T')[0] : '');

    const allServices = useMemo(() => [
        ...appData.servicePrices,
        ...appData.hourlyRates,
    ], [appData]);
    
    const isGerenciamentoDeObrasPresent = useMemo(() =>
        contractTypes.some(ct => ct.serviceName === 'Gerenciamento de Obras'),
        [contractTypes]
    );
    
    const installmentOptions = useMemo(() => {
        const maxInstallments = isGerenciamentoDeObrasPresent
            ? Math.max(25, (parseInt(durationMonths, 10) || 0) + 1)
            : 25;
        return [...Array(maxInstallments).keys()];
    }, [isGerenciamentoDeObrasPresent, durationMonths]);
    
    useEffect(() => {
        if (isGerenciamentoDeObrasPresent) {
            const durationMonthsNum = parseInt(durationMonths, 10) || 0;
            setFinancialInputs(prev => ({
                ...prev,
                installments: String(durationMonthsNum),
                downPaymentPercentage: '0',
            }));
        }
    }, [isGerenciamentoDeObrasPresent, durationMonths]);

    useEffect(() => {
        if (contractDate && !isEditing) {
             const cDate = new Date(contractDate);
             cDate.setDate(cDate.getDate() + 5);
             setDownPaymentDate(cDate.toISOString().split('T')[0]);
        } else if (contractDate && isEditing) {
             // Manual edit logic if needed
        }
    }, [contractDate, isEditing]);
    
    const handleContractDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setContractDate(newDate);
        if(newDate) {
            const cDate = new Date(newDate);
            cDate.setDate(cDate.getDate() + 5);
            setDownPaymentDate(cDate.toISOString().split('T')[0]);
        }
    };


    useEffect(() => {
        const servicesSubtotal = contractTypes.reduce((acc, ct) => acc + (parseFloat(ct.value) || 0), 0);
        
        let extraCost = 0;
        
        // Logic Calculation:
        // 1. If Tech Visits are enabled:
        //    Cost Per Visit = Base Price (configured) + (Mileage Enabled ? Distance * Rate (configured) : 0)
        //    Total Extra = Cost Per Visit * Quantity
        // 2. If Tech Visits disabled but Mileage enabled:
        //    Total Extra = Distance * Rate (Standard One-off Travel)

        if (techVisits.enabled) {
            const qty = parseFloat(techVisits.quantity) || 0;
            let unitPrice = VISIT_BASE_PRICE;
            
            if (mileage.enabled) {
                const dist = parseFloat(mileage.distance) || 0;
                unitPrice += (dist * MILEAGE_RATE);
            }
            
            extraCost = unitPrice * qty;
        } else if (mileage.enabled) {
            const dist = parseFloat(mileage.distance) || 0;
            extraCost = dist * MILEAGE_RATE;
        }

        const subtotal = servicesSubtotal + extraCost;
        
        const discountValueNum = parseFloat(financialInputs.discountValue) || 0;
        let discountAmount = 0;
        if (financialInputs.discountType === 'Porcentagem (%)' && discountValueNum > 0) {
            discountAmount = subtotal * (discountValueNum / 100);
        } else { // 'Valor (R$)'
            discountAmount = discountValueNum;
        }

        const total = subtotal - discountAmount;

        const downPaymentPercentageNum = parseFloat(financialInputs.downPaymentPercentage) || 0;
        const downPayment = total * (downPaymentPercentageNum / 100);
        
        const remaining = total - downPayment;
        
        const installmentsCount = parseInt(financialInputs.installments, 10) || 0;
        const installmentValue = installmentsCount > 0 ? remaining / installmentsCount : 0;

        setFinancials({
            subtotal,
            total,
            downPayment,
            remaining,
            installmentValue,
            mileageCost: extraCost,
        });

    }, [contractTypes, financialInputs, mileage, techVisits, VISIT_BASE_PRICE, MILEAGE_RATE]);

    useEffect(() => {
        const durationMonthsNum = parseInt(durationMonths, 10) || 0;
        const needsUpdate = contractTypes.some(ct => {
            const service = allServices.find(s => s.name === ct.serviceName);
            return service?.unit === 'mês';
        });

        if (needsUpdate) {
            const hasChanged = contractTypes.some(ct => {
                const service = allServices.find(s => s.name === ct.serviceName);
                if (service?.unit === 'mês' && service.price) {
                    const expectedValue = (service.price * durationMonthsNum).toFixed(2);
                    return ct.value !== expectedValue;
                }
                return false;
            });
            
            if (hasChanged) {
                 setContractTypes(prevContractTypes => prevContractTypes.map(ct => {
                    const service = allServices.find(s => s.name === ct.serviceName);
                    if (service?.unit === 'mês' && service.price) {
                        return { ...ct, value: (service.price * durationMonthsNum).toFixed(2) };
                    }
                    return ct;
                }));
            }
        }
    }, [durationMonths, contractTypes, allServices]);

    const handleFinancialInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFinancialInputs(prev => ({ ...prev, [name]: value }));
    };

    const handleFilesAdded = (category: keyof typeof uploadedFiles, newFiles: File[]) => {
        setUploadedFiles(prev => {
            const existingFiles = prev[category];
            const uniqueNewFiles = newFiles.filter(
                newFile => !existingFiles.some(
                    existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size
                )
            );
            return {
                ...prev,
                [category]: [...existingFiles, ...uniqueNewFiles]
            };
        });
    };

    const handleFileRemoved = (category: keyof typeof uploadedFiles, fileToRemove: File) => {
        setUploadedFiles(prev => ({
            ...prev,
            [category]: prev[category].filter(file => file !== fileToRemove)
        }));
    };

    const handleAddContractType = () => {
        setContractTypes([...contractTypes, {
          id: Date.now(),
          serviceName: '',
          calculationMethod: 'metragem',
          area: '',
          hours: '',
          value: '0.00',
        }]);
    };
    
    const handleRemoveContractType = (id: number) => {
        setContractTypes(contractTypes.filter(ct => ct.id !== id));
    };

    const handleContractTypeChange = (id: number, field: keyof Omit<ContractService, 'id'>, value: string) => {
        const newContractTypes = contractTypes.map(ct => {
            if (ct.id !== id) return ct;
    
            const updatedCt = { ...ct, [field]: value };
            const selectedService = allServices.find(s => s.name === updatedCt.serviceName);
    
            // Reset inputs on major changes
            if (field === 'serviceName') {
                updatedCt.area = '';
                updatedCt.hours = '';
                updatedCt.value = '0.00';
                if (selectedService) {
                    if (selectedService.name === 'Gerenciamento de Obras' || selectedService.name === 'Averbação') updatedCt.calculationMethod = 'manual';
                    else if (selectedService.unit === 'hora') updatedCt.calculationMethod = 'hora';
                    else if (selectedService.unit === 'm²') updatedCt.calculationMethod = 'metragem';
                    else updatedCt.calculationMethod = 'manual';
                } else {
                    updatedCt.calculationMethod = 'manual';
                }
            }
            
            // When calculation method is manually changed, reset associated inputs
            if (field === 'calculationMethod') {
                updatedCt.area = '';
                updatedCt.hours = '';
                updatedCt.value = '0.00';
            }
            
            const areaNum = parseFloat(updatedCt.area) || 0;
            const hoursNum = parseFloat(updatedCt.hours) || 0;
            let calculatedValue: number | null = null;
    
            // Calculation Logic Cascade
            if (updatedCt.calculationMethod === 'metragem' && areaNum > 0) {
                if (updatedCt.serviceName === 'Medição e Planta Baixa') {
                    // Tier logic for the specific service
                    let matchedTier = appData.measurementTiers[appData.measurementTiers.length - 1]; // Fallback
                    for (const tier of [...appData.measurementTiers].sort((a,b) => a.price - b.price)) {
                        const rangeParts = tier.range.replace(/m²/g, '').trim().split(' a ');
                        const min = parseFloat(rangeParts[0]);
                        const max = parseFloat(rangeParts[1]);
                        if (areaNum >= min && (isNaN(max) || areaNum <= max)) {
                            matchedTier = tier;
                            break;
                        }
                    }
                    calculatedValue = matchedTier?.price || 0;
                } else if (selectedService?.unit === 'm²' && selectedService.price) {
                    // Standard per-m² logic
                    calculatedValue = areaNum * selectedService.price;
                }
            } else if (updatedCt.calculationMethod === 'hora' && hoursNum > 0) {
                let hourlyRate: number | undefined;
                
                // First, check if the selected service itself is hourly and has a price.
                if (selectedService?.unit === 'hora' && typeof selectedService.price === 'number') {
                    hourlyRate = selectedService.price;
                } 
                // If not, and the calculation method is set to 'hora',
                // find a default rate from the hourlyRates settings.
                // We'll use the first available one.
                else if (appData.hourlyRates?.length > 0 && typeof appData.hourlyRates[0].price === 'number') {
                    hourlyRate = appData.hourlyRates[0].price;
                }

                if (typeof hourlyRate === 'number') {
                    calculatedValue = hoursNum * hourlyRate;
                }
            }
            
            // Monthly service logic (overrides other calculations if applicable)
            if (selectedService?.unit === 'mês' && selectedService.price) {
                calculatedValue = selectedService.price * (parseInt(durationMonths, 10) || 0);
            }
            
            // Final value assignment
            if (calculatedValue !== null) {
                // A calculation was successful. Use its result.
                updatedCt.value = calculatedValue.toFixed(2);
            } else if (field === 'value') {
                // User is manually editing the value field. Allow them to type freely.
                updatedCt.value = value;
            } else if ( (field === 'area' && areaNum === 0) || (field === 'hours' && hoursNum === 0) ) {
                // User cleared a calculation input. Reset the value if not in manual mode.
                if(updatedCt.calculationMethod !== 'manual') {
                    updatedCt.value = '0.00';
                }
            }
    
            return updatedCt;
        });
        setContractTypes(newContractTypes);
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const formProps = Object.fromEntries(formData.entries());

        const newAttachments = {
            signedContract: await Promise.all(uploadedFiles.signedContract.map(fileToBase64)),
            workFiles: await Promise.all(uploadedFiles.workFiles.map(fileToBase64)),
            sitePhotos: await Promise.all(uploadedFiles.sitePhotos.map(fileToBase64)),
        };

        const contractDataFromForm = {
            clientName: formProps.fullName as string,
            projectName: formProps.projectDescription as string, 
            totalValue: financials.total,
            date: new Date(`${contractDate}T00:00:00`),
            durationMonths: parseInt(durationMonths, 10) || 0,
            clientAddress: {
                street: formProps.clientStreet as string,
                number: formProps.clientNumber as string,
                complement: formProps.clientComplement as string,
                district: formProps.clientDistrict as string,
                city: formProps.clientCity as string,
                state: formProps.clientState as string,
                cep: formProps.clientCep as string,
            },
            projectAddress: isSameAddress ? {
                street: formProps.clientStreet as string,
                number: formProps.clientNumber as string,
                complement: formProps.clientComplement as string,
                district: formProps.clientDistrict as string,
                city: formProps.clientCity as string,
                state: formProps.clientState as string,
                cep: formProps.clientCep as string,
            } : {
                street: formProps.workStreet as string,
                number: formProps.workNumber as string,
                complement: formProps.workComplement as string,
                district: formProps.workDistrict as string,
                city: formProps.workCity as string,
                state: formProps.workState as string,
                cep: formProps.workCep as string,
            },
            downPayment: financials.downPayment,
            installments: parseInt(financialInputs.installments, 10) || 0,
            installmentValue: financials.installmentValue,
            serviceType: serviceType,
            services: contractTypes.map(ct => ({...ct, value: (parseFloat(ct.value.replace(',', '.')) || 0).toFixed(2) })),
            discountType: financialInputs.discountType,
            discountValue: parseFloat(financialInputs.discountValue) || 0,
            mileageDistance: mileage.enabled ? parseFloat(mileage.distance) || 0 : 0,
            mileageCost: financials.mileageCost,
            techVisits: {
                enabled: techVisits.enabled,
                quantity: parseFloat(techVisits.quantity) || 0,
                totalValue: techVisits.enabled ? financials.mileageCost : 0 // Assuming mileageCost now holds Total Extras if visits are on
            },
            downPaymentDate: new Date(`${downPaymentDate}T00:00:00`),
            firstInstallmentDate: firstInstallmentDate ? new Date(`${firstInstallmentDate}T00:00:00`) : new Date(),
        };
        
        if (isEditing) {
            const updatedAttachments = {
                signedContract: [...(editingContract.attachments?.signedContract || []), ...newAttachments.signedContract],
                workFiles: [...(editingContract.attachments?.workFiles || []), ...newAttachments.workFiles],
                sitePhotos: [...(editingContract.attachments?.sitePhotos || []), ...newAttachments.sitePhotos],
            };

            const updatedContract = {
                ...editingContract, // Preserve old fields like status, original attachments etc.
                ...contractDataFromForm, // Overwrite with new form data
                attachments: updatedAttachments, // Use the merged list of attachments
            };
            onUpdateContract(updatedContract);
        } else {
            const newContract = {
                ...contractDataFromForm,
                status: 'Ativo' as const, // Set defaults for new contract
                attachments: newAttachments,
            };
            onAddContract(newContract);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <div className="flex items-center">
                    <div>
                        <h1 className="text-3xl font-bold">{isEditing ? 'Editar Contrato' : 'Novo Contrato'}</h1>
                        <p className="mt-1 text-blue-100">
                           {isEditing ? 'Atualize os dados do contrato existente' : 'Cadastre um novo cliente e projeto'}
                        </p>
                    </div>
                </div>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit} key={editingContract?.id || 'new'}>
                <FormSection title="Dados do Cliente">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label="Nome Completo" id="fullName" className="md:col-span-1" required defaultValue={editingContract?.clientName}/>
                        <FormField label="Telefone" id="phone" placeholder="(00) 00000-0000" className="md:col-span-1" />
                        <FormField label="E-mail" id="email" type="email" className="md:col-span-1" />
                    </div>
                </FormSection>

                <FormSection title="Endereço do Cliente">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <FormField label="Rua" id="clientStreet" className="md:col-span-3" defaultValue={editingContract?.clientAddress.street} />
                        <FormField label="Número" id="clientNumber" className="md:col-span-1" defaultValue={editingContract?.clientAddress.number} />
                        <FormField label="Complemento" id="clientComplement" className="md:col-span-2" defaultValue={editingContract?.clientAddress.complement} />
                        <FormField label="Bairro" id="clientDistrict" className="md:col-span-2" defaultValue={editingContract?.clientAddress.district} />
                        <FormField label="Cidade" id="clientCity" className="md:col-span-2" defaultValue={editingContract?.clientAddress.city} />
                        <FormField label="Estado" id="clientState" className="md:col-span-1" defaultValue={editingContract?.clientAddress.state} />
                        <FormField label="CEP" id="clientCep" placeholder="00000-000" className="md:col-span-1" defaultValue={editingContract?.clientAddress.cep} />
                    </div>
                    <div className="flex items-center mt-4">
                        <input id="sameAddress" name="sameAddress" type="checkbox" checked={isSameAddress} onChange={(e) => setIsSameAddress(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="sameAddress" className="ml-2 block text-sm text-gray-900">Obra no mesmo endereço do cliente</label>
                    </div>
                </FormSection>
                
                {!isSameAddress && (
                    <FormSection title="Endereço da Obra">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <FormField label="Rua" id="workStreet" className="md:col-span-3" defaultValue={editingContract?.projectAddress.street} />
                            <FormField label="Número" id="workNumber" className="md:col-span-1" defaultValue={editingContract?.projectAddress.number} />
                            <FormField label="Complemento" id="workComplement" className="md:col-span-2" defaultValue={editingContract?.projectAddress.complement} />
                            <FormField label="Bairro" id="workDistrict" className="md:col-span-2" defaultValue={editingContract?.projectAddress.district} />
                            <FormField label="Cidade" id="workCity" className="md:col-span-2" defaultValue={editingContract?.projectAddress.city} />
                            <FormField label="Estado" id="workState" className="md:col-span-1" defaultValue={editingContract?.projectAddress.state} />
                            <FormField label="CEP" id="workCep" placeholder="00000-000" className="md:col-span-1" defaultValue={editingContract?.projectAddress.cep} />
                        </div>
                    </FormSection>
                )}

                <FormSection title="Tipos de Contrato">
                     <p className="text-sm text-slate-500 -mt-2 mb-4">Adicione múltiplos tipos de contrato. Os valores serão somados automaticamente.</p>
                    <div className="space-y-4">
                        {contractTypes.map((ct, index) => {
                            const selectedService = allServices.find(s => s.name === ct.serviceName);
                            const isGerenciamento = ct.serviceName === 'Gerenciamento de Obras';
                            const isMonthly = selectedService?.unit === 'mês';

                            // The value is auto-calculated and the field should be disabled if:
                            // 1. It's a special service like Gerenciamento or a monthly service, which are always calculated.
                            // 2. The calculation method is anything other than 'manual'.
                            const isCalculated = isGerenciamento || isMonthly || ct.calculationMethod !== 'manual';
                            
                            return (
                                <div key={ct.id} className="p-4 border rounded-md bg-slate-50/50 relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="font-semibold text-sm text-slate-600">Tipo {index + 1}</p>
                                        {contractTypes.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveContractType(ct.id)} className="text-slate-400 hover:text-red-600">
                                                <XIcon className="w-5 h-5"/>
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                         <FormField label="Tipo de Serviço" id={`serviceName-${ct.id}`} className="lg:col-span-1">
                                            <select 
                                                id={`serviceName-${ct.id}`} 
                                                value={ct.serviceName}
                                                onChange={e => handleContractTypeChange(ct.id, 'serviceName', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white">
                                                <option value="">Selecione...</option>
                                                {allServices.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                            </select>
                                        </FormField>
                                        <FormField label="Tipo de Cálculo" id={`calculationMethod-${ct.id}`} className="lg:col-span-1">
                                            <select 
                                                id={`calculationMethod-${ct.id}`} 
                                                value={ct.calculationMethod} 
                                                onChange={(e) => handleContractTypeChange(ct.id, 'calculationMethod', e.target.value as ContractService['calculationMethod'])} 
                                                disabled={isGerenciamento}
                                                className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 ${isGerenciamento ? 'bg-slate-100' : 'bg-white'}`}>
                                                <option value="metragem">Por Metragem (m²)</option>
                                                <option value="hora">Por Hora Técnica</option>
                                                <option value="manual">Valor Manual</option>
                                            </select>
                                        </FormField>

                                        {ct.calculationMethod === 'metragem' && <FormField label="Metragem (m²)" id={`area-${ct.id}`}><input type="text" id={`area-${ct.id}`} value={ct.area} onChange={(e) => handleContractTypeChange(ct.id, 'area', e.target.value)} placeholder="Ex: 100.00" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white" /></FormField>}
                                        {ct.calculationMethod === 'hora' && <FormField label="Qtd. Horas" id={`hours-${ct.id}`}><input type="number" id={`hours-${ct.id}`} value={ct.hours} onChange={(e) => handleContractTypeChange(ct.id, 'hours', e.target.value)} placeholder="Ex: 40" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white" /></FormField>}
                                        
                                        <FormField label="Valor do Serviço (R$)" id={`value-${ct.id}`} className="lg:col-span-1">
                                            <input 
                                                type="number" 
                                                id={`value-${ct.id}`} 
                                                disabled={isCalculated} 
                                                value={ct.value}
                                                onChange={(e) => handleContractTypeChange(ct.id, 'value', e.target.value)}
                                                placeholder="0.00"
                                                step="0.01"
                                                className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm h-10 px-3 ${isCalculated ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                                            />
                                        </FormField>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <button type="button" onClick={handleAddContractType} className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Adicionar Tipo
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t mt-6">
                        <FormField label="Data do Contrato (Assinatura)" id="contractDate" type="date" required value={contractDate} onChange={handleContractDateChange} />
                         <FormField label="Duração do Contrato (meses)" id="durationMonths" className="md:col-span-1">
                            <input
                                type="number"
                                id="durationMonths"
                                name="durationMonths"
                                value={durationMonths}
                                onChange={(e) => setDurationMonths(e.target.value)}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white"
                                min="0"
                            />
                        </FormField>
                    </div>
                    <FormField label="Como te encontrou?" id="source">
                            <select id="source" name="source" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white">
                                <option>Indicação</option>
                                <option>Instagram</option>
                                <option>Google</option>
                                <option>Outro</option>
                            </select>
                        </FormField>
                    <FormField label="Descrição do Projeto" id="projectDescription" className="mt-4">
                        <textarea id="projectDescription" name="projectDescription" rows={4} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 bg-white" defaultValue={editingContract?.projectName} />
                    </FormField>
                     <FormField label="Tipo de Serviço" id="serviceType" className="mt-4">
                        <div className="flex items-center space-x-6 flex-wrap gap-y-2">
                             <div className="flex items-center">
                                <input id="arquitetonico" name="serviceType" type="radio" value="Arquitetônico" checked={serviceType === 'Arquitetônico'} onChange={(e) => setServiceType(e.target.value)} className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                <label htmlFor="arquitetonico" className="ml-2 block text-sm font-medium text-slate-700">Arquitetônico</label>
                            </div>
                            <div className="flex items-center">
                                <input id="interiores" name="serviceType" type="radio" value="Design de Interiores" checked={serviceType === 'Design de Interiores'} onChange={(e) => setServiceType(e.target.value)} className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                <label htmlFor="interiores" className="ml-2 block text-sm font-medium text-slate-700">Design de Interiores</label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="residencial"
                                    name="serviceType"
                                    type="radio"
                                    value="Residencial"
                                    checked={serviceType === 'Residencial'}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="residencial" className="ml-2 block text-sm font-medium text-slate-700">
                                    Residencial
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="comercial"
                                    name="serviceType"
                                    type="radio"
                                    value="Comercial"
                                    checked={serviceType === 'Comercial'}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="comercial" className="ml-2 block text-sm font-medium text-slate-700">
                                    Comercial
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="corporativo"
                                    name="serviceType"
                                    type="radio"
                                    value="Corporativo"
                                    checked={serviceType === 'Corporativo'}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="corporativo" className="ml-2 block text-sm font-medium text-slate-700">
                                    Corporativo
                                </label>
                            </div>
                        </div>
                    </FormField>
                </FormSection>

                 <FormSection title="Custos Adicionais (Visitas e Deslocamento)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Visitas Técnicas */}
                        <div className="space-y-4 p-4 bg-slate-50 rounded-md">
                            <div className="flex items-center">
                                <input
                                    id="techVisits"
                                    name="techVisits"
                                    type="checkbox"
                                    checked={techVisits.enabled}
                                    onChange={(e) => setTechVisits(prev => ({ ...prev, enabled: e.target.checked }))}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                                <label htmlFor="techVisits" className="ml-2 block text-sm font-medium text-slate-700">
                                    Incluir Visitas Técnicas in loco?
                                </label>
                            </div>
                             {techVisits.enabled && (
                                <div className="pl-6 space-y-3">
                                    <FormField label="Quantidade de Visitas" id="techVisitsQty">
                                        <input
                                            type="number"
                                            id="techVisitsQty"
                                            value={techVisits.quantity}
                                            onChange={(e) => setTechVisits(prev => ({...prev, quantity: e.target.value}))}
                                            className="mt-1 block w-full max-w-xs rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white"
                                            min="1"
                                        />
                                    </FormField>
                                    <p className="text-xs text-slate-500">
                                        Valor base por visita: <span className="font-semibold">{formatCurrency(VISIT_BASE_PRICE)}</span>
                                        {mileage.enabled && <span> + Custo de deslocamento (automático)</span>}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Quilometragem */}
                        <div className="space-y-4 p-4 bg-slate-50 rounded-md">
                             <div className="flex items-center">
                                <input
                                    id="addMileage"
                                    name="addMileage"
                                    type="checkbox"
                                    checked={mileage.enabled}
                                    onChange={(e) => setMileage(prev => ({ ...prev, enabled: e.target.checked }))}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                                <label htmlFor="addMileage" className="ml-2 block text-sm font-medium text-slate-700">
                                    Adicionar Custo de Quilometragem?
                                </label>
                            </div>
                            {mileage.enabled && (
                                <div className="pl-6 space-y-3">
                                    <FormField label="Distância (Km) - Ida e Volta" id="mileageDistance">
                                        <input
                                            type="number"
                                            id="mileageDistance"
                                            name="mileageDistance"
                                            value={mileage.distance}
                                            onChange={(e) => setMileage(prev => ({...prev, distance: e.target.value}))}
                                            className="mt-1 block w-full max-w-xs rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white"
                                            placeholder="Ex: 50"
                                            min="0"
                                            step="0.1"
                                        />
                                    </FormField>
                                    <p className="text-xs text-slate-500">
                                        Custo por Km: R$ {MILEAGE_RATE.toFixed(2)}.
                                        {techVisits.enabled ? " O valor será somado a CADA visita." : " Valor cobrado como taxa única de deslocamento."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </FormSection>


                <FormSection title="Valores e Pagamento">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <FormField label="Tipo de Desconto" id="discountType">
                            <select name="discountType" value={financialInputs.discountType} onChange={handleFinancialInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white">
                                <option>Valor (R$)</option>
                                <option>Porcentagem (%)</option>
                            </select>
                        </FormField>
                        <FormField label="Desconto" id="discountValue">
                            <input type="number" name="discountValue" value={financialInputs.discountValue} onChange={handleFinancialInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white" />
                        </FormField>
                        <FormField label="Valor Total" id="totalValue">
                            <input type="text" name="totalValue" disabled value={formatCurrency(financials.total)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm h-10 px-3 bg-slate-100 text-slate-500 font-bold cursor-not-allowed"/>
                        </FormField>
                         <FormField label="% Entrada" id="downPaymentPercentage">
                            <input type="number" name="downPaymentPercentage" value={financialInputs.downPaymentPercentage} onChange={handleFinancialInputChange} disabled={isGerenciamentoDeObrasPresent} className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 ${isGerenciamentoDeObrasPresent ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`} />
                        </FormField>
                    </div>
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Subtotal dos Serviços:</span>
                            <span className="font-medium text-slate-700">{formatCurrency(financials.subtotal - financials.mileageCost)}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">
                                {techVisits.enabled 
                                    ? `Visitas Técnicas (${techVisits.quantity}x) + Deslocamento:` 
                                    : "Custo de Deslocamento (Único):"}
                            </span>
                            <span className="font-medium text-slate-700">{formatCurrency(financials.mileageCost)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t pt-3">
                            <span className="text-slate-500 font-semibold">Subtotal Geral:</span>
                            <span className="font-bold text-slate-800">{formatCurrency(financials.subtotal)}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Desconto:</span>
                            <span className="font-medium text-red-600">-{formatCurrency(financials.subtotal - financials.total)}</span>
                        </div>
                    </div>
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <p className="text-sm text-slate-500">Valor de Entrada</p>
                            <p className="text-xl font-bold text-blue-600">{formatCurrency(financials.downPayment)}</p>
                        </div>
                         <div>
                            <p className="text-sm text-slate-500">Valor Restante</p>
                            <p className="text-xl font-bold text-orange-500">{formatCurrency(financials.remaining)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <FormField label="Data de Pagamento da Entrada" id="downPaymentDate" type="date" required value={downPaymentDate} onChange={(e) => setDownPaymentDate(e.target.value)} />
                        <FormField label="Data da Primeira Parcela" id="firstInstallmentDate" type="date" value={firstInstallmentDate} onChange={(e) => setFirstInstallmentDate(e.target.value)} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-end">
                        <FormField label="Número de Parcelas" id="installments">
                            <select name="installments" value={financialInputs.installments} onChange={handleFinancialInputChange} disabled={isGerenciamentoDeObrasPresent} className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 ${isGerenciamentoDeObrasPresent ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}>
                                {installmentOptions.map(i => <option key={i} value={i}>{i}x</option>)}
                            </select>
                        </FormField>
                        <FormField label="Valor de Cada Parcela" id="installmentValue">
                            <input type="text" name="installmentValue" disabled value={formatCurrency(financials.installmentValue)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm h-10 px-3 bg-slate-100 text-slate-500 cursor-not-allowed"/>
                        </FormField>
                    </div>
                </FormSection>

                <FormSection title="Anexos">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FileUploadArea
                            title="Contrato Assinado"
                            files={uploadedFiles.signedContract}
                            onFilesAdded={(files) => handleFilesAdded('signedContract', files)}
                            onFileRemoved={(file) => handleFileRemoved('signedContract', file)}
                        />
                        <FileUploadArea
                            title="Arquivos da Obra"
                            files={uploadedFiles.workFiles}
                            onFilesAdded={(files) => handleFilesAdded('workFiles', files)}
                            onFileRemoved={(file) => handleFileRemoved('workFiles', file)}
                        />
                        <FileUploadArea
                            title="Fotos do Local"
                            files={uploadedFiles.sitePhotos}
                            onFilesAdded={(files) => handleFilesAdded('sitePhotos', files)}
                            onFileRemoved={(file) => handleFileRemoved('sitePhotos', file)}
                        />
                    </div>
                </FormSection>
                
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onCancel} className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
                    <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">{isEditing ? 'Salvar Alterações' : 'Salvar'}</button>
                </div>
            </form>
        </div>
    );
};

export default NewContract;
