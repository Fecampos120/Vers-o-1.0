
import React, { useState, useMemo } from 'react';
import { Reminder } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CalendarProps {
  reminders: Reminder[];
}

const Calendar: React.FC<CalendarProps> = ({ reminders }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const remindersByDate = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    reminders.forEach(reminder => {
      if(reminder.date){
          const dateKey = new Date(reminder.date).toISOString().split('T')[0];
          if (!map.has(dateKey)) {
            map.set(dateKey, []);
          }
          map.get(dateKey)!.push(reminder);
      }
    });
    return map;
  }, [reminders]);

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };

  const daysInMonthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    
    const grid = [];
    // Start from the Sunday of the week the month begins on
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    // Create a 6-week grid (42 days)
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      grid.push(day);
    }
    return grid;
  }, [currentDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">
          {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
        </h2>
        <div className="flex items-center space-x-2">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Mês anterior">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Próximo mês">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-sm">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="font-semibold text-slate-500 py-2">{day}</div>
        ))}
        {daysInMonthGrid.map((day, index) => {
          const dateKey = day.toISOString().split('T')[0];
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.getTime() === today.getTime();
          const dayReminders = remindersByDate.get(dateKey) || [];

          return (
            <div key={index} className="relative py-2 group h-12 flex items-center justify-center">
              <time
                dateTime={dateKey}
                className={`mx-auto h-8 w-8 flex items-center justify-center rounded-full
                  ${isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}
                  ${isToday ? 'bg-blue-600 text-white font-semibold' : ''}
                  ${!isToday && isCurrentMonth ? 'hover:bg-slate-100 cursor-pointer' : ''}
                `}
              >
                {day.getDate()}
              </time>
              {dayReminders.length > 0 && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              )}
              {dayReminders.length > 0 && (
                <div className="absolute top-full -mt-1 w-64 p-3 bg-slate-800 text-white rounded-lg shadow-lg z-10 invisible group-hover:visible transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none">
                   <div className="text-left text-xs space-y-2">
                     {dayReminders.map(r => (
                       <div key={r.id}>
                         <p className="font-bold text-white">{r.clientName}</p>
                         <p className="text-slate-300">{r.description}</p>
                       </div>
                     ))}
                   </div>
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-slate-800"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;