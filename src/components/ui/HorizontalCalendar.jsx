import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const HorizontalCalendar = ({ selectedDate, onSelectDate }) => {
  const scrollRef = useRef(null);

  // Gera dias do mês atual e do próximo
  const generateDays = () => {
    const days = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 5); // Começa 5 dias atrás
    
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = generateDays();

  const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      <button 
        onClick={() => scroll('left')} 
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
      >
        <ChevronLeft size={20}/>
      </button>
      
      <div 
        ref={scrollRef} 
        className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          
          return (
            <button
              key={index}
              onClick={() => onSelectDate(date)}
              className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all snap-start border ${
                isSelected 
                  ? 'bg-[#5B2EFF] text-white border-[#5B2EFF] shadow-lg shadow-purple-900/50 scale-105' 
                  : 'bg-[#1c1c24] text-gray-400 border-white/5 hover:bg-white/5'
              }`}
            >
              <span className="text-[10px] font-bold uppercase">{date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
              <span className={`text-xl font-bold ${isSelected ? 'text-white' : isToday ? 'text-[#5B2EFF]' : 'text-white'}`}>
                {date.getDate()}
              </span>
              {isToday && <span className="w-1 h-1 rounded-full bg-[#5B2EFF]"></span>}
            </button>
          );
        })}
      </div>

      <button 
        onClick={() => scroll('right')} 
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={20}/>
      </button>
    </div>
  );
};