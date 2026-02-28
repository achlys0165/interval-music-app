import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CalendarPickerProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  label?: string;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onSelect, label }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    
    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= days; i++) calendarDays.push(new Date(year, month, i));
    return calendarDays;
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const toISODate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return 'Select date...';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isSelected = (date: Date) => {
    return toISODate(date) === selectedDate;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return toISODate(date) === toISODate(today);
  };

  const handleSelect = (date: Date) => {
    onSelect(toISODate(date));
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 mb-2 block">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-sm text-left text-white flex items-center justify-between hover:border-white/30 transition-all"
      >
        <span className={selectedDate ? 'text-white' : 'text-white/40'}>
          {formatDisplay(selectedDate)}
        </span>
        <Calendar size={18} className="text-white/40" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 z-50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="font-bold text-sm">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-[10px] font-black text-white/20 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
                
                const selected = isSelected(date);
                const today = isToday(date);
                const isSunday = date.getDay() === 0;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(date)}
                    className={`
                      aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-bold transition-all
                      ${selected 
                        ? 'bg-white text-black' 
                        : today
                          ? 'border border-white/40 text-white'
                          : isSunday
                            ? 'text-white/60 hover:bg-white/5'
                            : 'text-white/40 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    {date.getDate()}
                    {isSunday && !selected && (
                      <span className="text-[6px] uppercase mt-0.5 opacity-50">Sun</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick select buttons */}
            <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextSunday = new Date();
                  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7);
                  if (nextSunday.getTime() < new Date().getTime()) {
                    nextSunday.setDate(nextSunday.getDate() + 7);
                  }
                  handleSelect(nextSunday);
                }}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/60"
              >
                Next Sunday
              </button>
              <button
                type="button"
                onClick={() => handleSelect(new Date())}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/60"
              >
                Today
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarPicker;