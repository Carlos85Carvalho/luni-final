import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configura o idioma para Português
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Estilos CSS para forçar o Modo Escuro no Calendário
const darkCalendarStyles = `
  .rbc-calendar { color: #e4e4e7; font-family: sans-serif; min-height: 500px; }
  
  /* Cabeçalho (Mês/Ano) */
  .rbc-toolbar { margin-bottom: 20px; }
  .rbc-toolbar button { color: #fff; border: 1px solid #3f3f46; border-radius: 8px; }
  .rbc-toolbar button:hover { background-color: #27272a; }
  .rbc-toolbar button.rbc-active { background-color: #5B2EFF; border-color: #5B2EFF; color: white; }
  .rbc-toolbar-label { font-weight: bold; font-size: 1.2rem; text-transform: capitalize; }

  /* Dias da Semana */
  .rbc-header { border-bottom: 1px solid #3f3f46; padding: 12px; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; color: #a1a1aa; }
  
  /* Células e Linhas */
  .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid #27272a; background-color: #18181b; border-radius: 16px; overflow: hidden; }
  .rbc-day-bg { border-left: 1px solid #27272a; }
  .rbc-off-range-bg { background-color: #0f0f12; }
  .rbc-today { background-color: rgba(91, 46, 255, 0.05); }
  
  /* Eventos (Agendamentos) */
  .rbc-event { 
    background-color: #5B2EFF; 
    border-radius: 6px; 
    border: none; 
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); 
    padding: 2px 5px;
  }
  .rbc-event-label { display: none; } /* Esconde o horário duplicado */
  .rbc-event-content { font-size: 0.85rem; font-weight: 500; }
  
  /* Visualização de Dia/Semana */
  .rbc-time-content { border-top: 1px solid #3f3f46; }
  .rbc-time-header-content { border-left: 1px solid #3f3f46; }
  .rbc-timeslot-group { border-bottom: 1px solid #27272a; }
  .rbc-day-slot .rbc-time-slot { border-top: 1px solid #27272a; }
`;

export const CalendarView = ({ agendamentos }) => {
  
  // Transforma seus dados do Supabase para o formato do Calendário
  const eventos = agendamentos.map(agendamento => {
    // Cria data segura ignorando fuso horário para visualização correta
    const [ano, mes, dia] = agendamento.data.split('-');
    const [hora, minuto] = agendamento.horario.split(':');
    
    const start = new Date(ano, mes - 1, dia, hora, minuto);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // Duração de 1h padrão

    return {
      title: `${agendamento.cliente_nome} - ${agendamento.servico}`,
      start,
      end,
      resource: agendamento
    };
  });

  return (
    <div className="bg-[#18181b] p-6 rounded-3xl border border-white/5 shadow-2xl mt-4">
      <style>{darkCalendarStyles}</style>
      <Calendar
        localizer={localizer}
        events={eventos}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        culture="pt-BR"
        messages={{
          next: "Próximo",
          previous: "Voltar",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Lista",
          date: "Data",
          time: "Hora",
          event: "Cliente",
          noEventsInRange: "Sem agendamentos."
        }}
      />
    </div>
  );
};