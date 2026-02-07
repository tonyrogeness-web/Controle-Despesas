
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
      bgColor: 'bg-black/40 backdrop-blur-3xl',
      textColor: 'text-emerald-500/80',
      valueColor: 'text-emerald-500',
      borderColor: 'border-emerald-900/60',
      hoverBorder: 'hover:border-white/40'
    },
    {
      title: 'Despesas Consolidadas',
      value: summary.total,
      icon: <Receipt className="w-6 h-6 md:w-8 md:h-8 text-red-500/60" />,
      bgColor: 'bg-black/40 backdrop-blur-3xl',
      textColor: 'text-zinc-400',
      valueColor: 'text-red-500',
      borderColor: 'border-red-900/60',
      hoverBorder: 'hover:border-white/40'
    },
    {
      title: 'Saldo Líquido',
      value: balance,
      icon: <Wallet className={`w-6 h-6 md:w-8 md:h-8 ${isBalanceNegative ? 'text-red-500/80' : 'text-emerald-500/80'}`} />,
      bgColor: 'bg-black/40 backdrop-blur-3xl',
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`${card.bgColor} rounded-2xl md:rounded-3xl p-4 md:p-6 border ${card.borderColor} ${card.hoverBorder} flex flex-col gap-4 md:gap-6 transition-all duration-500 hover:-translate-y-1 shadow-lg hover:shadow-xl group relative overflow-hidden active:scale-[0.98] cursor-default bubble-card`}
        >
          {/* Indicador visual idêntico ao do faturamento (cor verde) */}
          <CornerBubble color="emerald" />

          <div className="absolute top-0 left-0 right-0 h-12 md:h-16 bg-gradient-to-b from-zinc-800/10 to-transparent pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity"></div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="p-2 md:p-3 bg-black/40 rounded-lg md:rounded-xl shadow-inner border border-white/5 group-hover:border-white/20 transition-colors shrink-0">
              {React.cloneElement(card.icon as React.ReactElement, { className: `w-5 h-5 md:w-6 md:h-6 ${card.icon.props.className.split(' ').filter((c: string) => c.startsWith('text-')).join(' ')}` })}
            </div>

            <div className="flex flex-col">
              <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5 italic group-hover:text-zinc-400 transition-colors">
                {card.title}
              </p>
              <p className={`text-lg md:text-2xl font-black ${card.valueColor} tracking-tight drop-shadow-lg leading-none`}>
                {formatCurrency(card.value)}
              </p>
            </div>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
            <Wifi className="w-2 h-2 text-zinc-600 animate-pulse" />
            <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-wider italic">Live</span>
          </div>

          <div className={`absolute bottom-0 left-0 right-0 h-px ${idx === 1 ? 'bg-red-500/20' : 'bg-emerald-500/20'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
