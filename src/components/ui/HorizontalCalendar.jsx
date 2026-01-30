import React, { useEffect, useRef } from 'react';

export const HorizontalCalendar = ({ selectedDate, onSelectDate }) => {
  const scrollRef = useRef(null);

  // Gera os próximos 14 dias automaticamente
  const generateDays = () => {
    const days = [];
    const hoje = new Date();
    
    // Começa de 2 dias atrás para dar contexto
    for (let i = -2; i < 14; i++) {
      const d = new Date();
      d.setDate(hoje.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = generateDays();

  // Formata dia da semana (SEG, TER...)
  const getWeekDay = (date) => {
    const dia = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    return dia.replace('.', '').toUpperCase().slice(0, 3);
  };

  // Formata dia do mês (01, 02...)
  const getDayNumber = (date) => {
    return date.getDate();
  };

  // Compara datas sem ligar para a hora
  const isSameDay = (d1, d2) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-4 pt-2 no-scrollbar" ref={scrollRef}>
      <div className="flex gap-3 px-1">
        {days.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <button
              key={index}
              onClick={() => onSelectDate(date)}
              className={`
                flex flex-col items-center justify-center min-w-[64px] h-[84px] rounded-[20px] transition-all duration-300 border
                ${isSelected 
                  ? 'bg-gradient-to-br from-[#5B2EFF] to-cyan-500 border-transparent shadow-[0_8px_16px_rgba(91,46,255,0.4)] transform scale-105' 
                  : 'bg-[#1c1c24] border-white/5 hover:border-white/20'
                }
              `}
            >
              <span className={`text-[10px] font-bold tracking-widest mb-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                {getWeekDay(date)}
              </span>
              <span className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-white/70'}`}>
                {getDayNumber(date)}
              </span>
              {isToday && !isSelected && (
                <div className="w-1 h-1 bg-cyan-500 rounded-full mt-1"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};