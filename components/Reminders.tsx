
import React, { useState } from 'react';
import { Client, Reminder } from '../types';
import { CalendarIcon, TrashIcon } from './Icons';
import Calendar from './Calendar';

interface RemindersProps {
  reminders: Reminder[];
  setReminders: (reminders: Reminder[]) => void;
  clients: Client[];
}

const ReminderItem: React.FC<{
  reminder: Reminder;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}> = ({ reminder, onToggle, onDelete }) => {
  const getStatus = () => {
    if (reminder.completed) {
      return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminderDate = new Date(reminder.date);
    reminderDate.setHours(0, 0, 0, 0);

    const diffTime = reminderDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-xs font-semibold text-red-600">
          Atrasado há {Math.abs(diffDays)} dia(s)
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="text-xs font-semibold text-orange-500">
          Vence Hoje
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold text-blue-600">
        Vence em {diffDays} dia(s)
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={reminder.completed}
          onChange={() => onToggle(reminder.id)}
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="ml-4">
          <p className={`text-slate-800 ${reminder.completed ? 'line-through text-slate-500' : ''}`}>
            {reminder.description}
          </p>
          <p className="text-sm text-slate-500 flex items-center mt-1">
            <span className="font-medium">{reminder.clientName}</span>
            <span className="mx-2">|</span>
            <CalendarIcon className="w-4 h-4 mr-1 text-slate-400" />
            {new Date(reminder.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {getStatus()}
        <button onClick={() => onDelete(reminder.id)} className="text-slate-400 hover:text-red-600">
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const Reminders: React.FC<RemindersProps> = ({ reminders, setReminders, clients }) => {
  const [newReminderDesc, setNewReminderDesc] = useState('');
  const [newReminderClient, setNewReminderClient] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderDesc || !newReminderClient || !newReminderDate) return;
    
    const client = clients.find(c => c.id === parseInt(newReminderClient));
    if (!client) return;

    const newReminder: Reminder = {
      id: Date.now(),
      clientId: client.id,
      clientName: client.name,
      description: newReminderDesc,
      date: new Date(`${newReminderDate}T00:00:00`),
      completed: false,
    };
    setReminders([newReminder, ...reminders]);
    setNewReminderDesc('');
    setNewReminderClient('');
    setNewReminderDate('');
  };

  const handleToggleReminder = (id: number) => {
    setReminders(
      reminders.map(r => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };
  
  const handleDeleteReminder = (id: number) => {
    setReminders(reminders.filter(r => r.id !== id));
  };
  
  const pendingReminders = reminders.filter(r => !r.completed).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const completedReminders = reminders.filter(r => r.completed);

  return (
    <div className="space-y-8">
      <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
        <h1 className="text-3xl font-bold">Lembretes</h1>
        <p className="mt-1 text-blue-100">
          Gerencie suas tarefas e pendências importantes.
        </p>
      </header>

      <section>
        <Calendar reminders={reminders} />
      </section>

      <section className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold text-slate-800">Adicionar Novo Lembrete</h2>
        <form onSubmit={handleAddReminder} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label htmlFor="client" className="block text-sm font-medium text-slate-600">Cliente</label>
            <select
              id="client"
              value={newReminderClient}
              onChange={(e) => setNewReminderClient(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
            >
              <option value="">Selecione...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-600">Descrição</label>
            <input
              type="text"
              id="description"
              value={newReminderDesc}
              onChange={(e) => setNewReminderDesc(e.target.value)}
              placeholder="O que precisa ser feito?"
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="date" className="block text-sm font-medium text-slate-600">Data</label>
            <input
              type="date"
              id="date"
              value={newReminderDate}
              onChange={(e) => setNewReminderDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
            />
          </div>
          <div className="md:col-span-4">
              <button type="submit" className="w-full md:w-auto justify-center rounded-md border border-transparent bg-blue-600 py-2 px-8 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                + Adicionar
              </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Pendentes ({pendingReminders.length})</h2>
        <div className="space-y-3">
          {pendingReminders.length > 0 ? (
            pendingReminders.map(reminder => (
              <ReminderItem key={reminder.id} reminder={reminder} onToggle={handleToggleReminder} onDelete={handleDeleteReminder} />
            ))
          ) : (
            <div className="text-center py-4 text-slate-500">Nenhum lembrete pendente.</div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Concluídos ({completedReminders.length})</h2>
        <div className="space-y-3">
          {completedReminders.length > 0 ? (
            completedReminders.map(reminder => (
              <ReminderItem key={reminder.id} reminder={reminder} onToggle={handleToggleReminder} onDelete={handleDeleteReminder} />
            ))
          ) : (
             <div className="text-center py-4 text-slate-500">Nenhum lembrete concluído.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Reminders;