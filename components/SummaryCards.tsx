import React from 'react';
import { SummaryData } from '../types';
import { Receipt, Landmark, Wallet, Wifi } from 'lucide-react';
import CornerBubble from './CornerBubble';

interface SummaryCardsProps { summary: SummaryData; }

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const balance = summary.revenue - summary.total;
  const isBalanceNegative = balance < 0;
  
  const cards = [
    {
      title: 'Receita de Caixa',
      value: summary.revenue,
      icon: <Landmark className="w-6 h-6 md:w-8 md:h-8 text-emerald-500/80" />,
      bgColor: 'bg-[#050505]', 
      textColor: 'text-emerald-500/80',
      valueColor: 'text-emerald-500',
      borderColor: 'border-emerald-900/60',
      hoverBorder: 'hover:border-white/40'
    },
    {
      title: 'Despesas Consolidadas',
      value: summary.total,
      icon: <Receipt className="w-6 h-6 md:w-8 md:h-8 text-red-500/60" />,
      bgColor: 'bg-[#050505]',
      textColor: 'text-zinc-400',
      valueColor: 'text-red-500',
      borderColor: 'border-red-900/60',
      hoverBorder: 'hover:border-white/40'
    },
    {
      title: 'Saldo Líquido',
      value: balance,
      icon: <Wallet className={`w-6 h-6 md:w-8 md:h-8 ${isBalanceNegative ? 'text-red-500/80' : 'text-emerald-500/80'}`} />,
      bgColor: 'bg-[#050505]',
      textColor: isBalanceNegative ? 'text-red-400/80' : 'text-emerald-400/80',
      valueColor: isBalanceNegative ? 'text-red-500' : 'text-emerald-400',
      borderColor: isBalanceNegative ? 'border-red-900/60' : 'border-emerald-900/60',
      hoverBorder: 'hover:border-white/40'
    },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-16">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className={`${card.bgColor} rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-4 ${card.borderColor} ${card.hoverBorder} flex flex-col gap-6 md:gap-8 transition-all duration-500 hover:-translate-y-1.5 shadow-[4px_-4px_20px_rgba(80,80,80,0.4),_0_8px_30px_rgb(0,0,0,0.6)] hover:shadow-[6px_-6px_30px_rgba(80,80,80,0.5),_0_30px_60px_rgba(0,0,0,0.8)] group relative overflow-hidden active:scale-[0.98] cursor-default bubble-card`}
        >
          {/* Indicador visual idêntico ao do faturamento (cor verde) */}
          <CornerBubble color="emerald" />

          <div className="absolute top-0 left-0 right-0 h-16 md:h-24 bg-gradient-to-b from-zinc-800/20 to-transparent pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="p-3 md:p-4 bg-black/40 rounded-xl md:rounded-2xl shadow-inner border-2 border-white/5 group-hover:border-white/30 transition-colors">
              {card.icon}
            </div>
            <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
               <Wifi className="w-2 md:w-2.5 h-2 md:h-2.5 text-zinc-600 animate-pulse" />
               <span className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Live Feed</span>
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-[9px] md:text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1 md:mb-2 italic group-hover:text-zinc-400 transition-colors">
              {card.title}
            </p>
            <p className={`text-2xl md:text-4xl font-black ${card.valueColor} tracking-tighter drop-shadow-2xl`}>
              {formatCurrency(card.value)}
            </p>
          </div>
          
          <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${idx === 1 ? 'bg-red-500/20' : 'bg-emerald-500/20'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;