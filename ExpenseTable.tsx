
import React from 'react';
import { Expense } from '../types';
import { Edit2, Clock, Trash2, Activity, Tag, DollarSign } from 'lucide-react';

interface ExpenseTableProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

const TableCornerBubble = () => (
  <div className="absolute top-4 right-4 z-20 flex items-center justify-center pointer-events-none">
    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-black border-2 border-emerald-900/40 group-hover:border-emerald-500 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] flex items-center justify-center relative transition-all duration-500">
      <div className="w-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] group-hover:shadow-[0_0_25px_#10b981] animate-pulse"></div>
    </div>
  </div>
);

const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, onDelete, onEdit }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (expenses.length === 0) {
    return (
      <div className="rounded-[1.5rem] md:rounded-[2.5rem] border-4 border-emerald-500/20 bg-black/40 backdrop-blur-3xl p-20 flex flex-col items-center gap-6 opacity-20 shadow-2xl">
        <Activity className="w-16 h-16 md:w-20 md:h-20 text-zinc-500 animate-pulse" />
        <span className="text-zinc-500 font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[11px] md:text-[13px]">BANCO DE DADOS VAZIO</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Visualização para Desktop - Tabela */}
      <div className="hidden md:block overflow-x-auto rounded-[2.5rem] border-4 border-emerald-500/20 group-hover:border-white/40 transition-all bg-black/40 backdrop-blur-3xl shadow-2xl relative custom-scrollbar">
        <TableCornerBubble />
        <table className="w-full text-left border-separate border-spacing-y-4 px-4">
          <thead className="bg-transparent">
            <tr>
              <th className="px-10 py-6 text-[12px] font-black text-zinc-500 uppercase tracking-[0.35em] italic border-b-2 border-white/5">Lançamento</th>
              <th className="px-10 py-6 text-[12px] font-black text-zinc-500 uppercase tracking-[0.35em] italic border-b-2 border-white/5">Categoria</th>
              <th className="px-10 py-6 text-[12px] font-black text-zinc-500 uppercase tracking-[0.35em] italic text-center border-b-2 border-white/5">Vencimento</th>
              <th className="px-10 py-6 text-[12px] font-black text-zinc-500 uppercase tracking-[0.35em] italic text-right border-b-2 border-white/5">Valor (BRL)</th>
              <th className="px-10 py-6 text-[12px] font-black text-zinc-500 uppercase tracking-[0.35em] italic text-center border-b-2 border-white/5">Ações</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-white/[0.04] transition-all group/row">
                <td className="px-10 py-8 relative bg-zinc-900/20 rounded-l-3xl">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-emerald-500/40 group-hover/row:bg-emerald-500 transition-all"></div>
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-black text-zinc-100 uppercase tracking-widest group-hover/row:text-emerald-400 transition-colors truncate">
                      {exp.name}
                    </span>
                    <span className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      #{exp.id.slice(0, 6).toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="px-10 py-8 relative bg-zinc-900/20">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-emerald-500/40 group-hover/row:bg-emerald-500 transition-all"></div>
                  <span className="text-[11px] font-black text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/30 px-5 py-2.5 rounded-xl uppercase tracking-[0.2em]">
                    {exp.category}
                  </span>
                </td>
                <td className="px-10 py-8 relative text-center bg-zinc-900/20">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-emerald-500/40 group-hover/row:bg-emerald-500 transition-all"></div>
                  <div className="flex items-center justify-center gap-3 text-zinc-400 text-[13px] font-black tracking-widest italic whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 text-emerald-500/60" />
                    {formatDate(exp.dueDate)}
                  </div>
                </td>
                <td className="px-10 py-8 relative text-right bg-zinc-900/20">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-emerald-500/40 group-hover/row:bg-emerald-500 transition-all"></div>
                  <span className="font-black text-white text-2xl tracking-tighter group-hover/row:text-emerald-400">
                    {formatCurrency(exp.value)}
                  </span>
                </td>
                <td className="px-10 py-8 relative bg-zinc-900/20 rounded-r-3xl">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-emerald-500/40 group-hover/row:bg-emerald-500 transition-all"></div>
                  <div className="flex items-center justify-center gap-5">
                    <button onClick={() => onEdit(exp)} className="p-3 bg-black border-2 border-white/5 hover:border-emerald-500 text-zinc-500 hover:text-white hover:bg-emerald-600 rounded-2xl transition-all bubble-btn">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => onDelete(exp.id)} className="p-3 bg-black border-2 border-white/5 hover:border-red-500 text-zinc-500 hover:text-white hover:bg-red-600 rounded-2xl transition-all bubble-btn">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visualização para Mobile - Cards Dinâmicos */}
      <div className="block md:hidden space-y-4">
        {expenses.map((exp) => (
          <div key={exp.id} className="glass rounded-[2rem] border-2 border-emerald-500/20 p-6 flex flex-col gap-5 shadow-xl relative overflow-hidden bubble-card">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
            
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1 max-w-[70%]">
                <span className="text-sm font-black text-white uppercase tracking-widest truncate">{exp.name}</span>
                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">#{exp.id.slice(0, 6).toUpperCase()}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(exp)} className="p-2.5 bg-black border border-white/5 rounded-xl text-zinc-400 hover:text-emerald-400 active:bg-emerald-500/10 transition-all bubble-btn">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(exp.id)} className="p-2.5 bg-black border border-white/5 rounded-xl text-zinc-400 hover:text-red-400 active:bg-red-500/10 transition-all bubble-btn">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" /> Grupo
                </span>
                <span className="text-[10px] font-black text-emerald-400/80 bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-fit">
                  {exp.category}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Prazo
                </span>
                <span className="text-[10px] font-bold text-zinc-300 italic">
                  {formatDate(exp.dueDate)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  Montante Final
               </span>
               <span className="text-xl font-black text-white tracking-tighter">
                 {formatCurrency(exp.value)}
               </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseTable;
