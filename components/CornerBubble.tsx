import React from 'react';

interface CornerBubbleProps {
  color?: 'emerald' | 'red' | 'blue' | 'zinc';
}

const CornerBubble: React.FC<CornerBubbleProps> = ({ color = 'emerald' }) => {
  const colorClasses = {
    red: {
      border: 'border-red-900/40 group-hover:border-red-500 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]',
      dot: 'bg-red-500 shadow-[0_0_8px_#ef4444] group-hover:shadow-[0_0_25px_#ef4444]'
    },
    emerald: {
      border: 'border-emerald-900/40 group-hover:border-emerald-500 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]',
      dot: 'bg-emerald-500 shadow-[0_0_12px_#10b981] group-hover:shadow-[0_0_25px_#10b981]'
    },
    blue: {
      border: 'border-blue-900/40 group-hover:border-blue-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]',
      dot: 'bg-blue-500 shadow-[0_0_8px_#3b82f6] group-hover:shadow-[0_0_25px_#3b82f6]'
    },
    zinc: {
      border: 'border-zinc-700/40 group-hover:border-zinc-500 group-hover:shadow-[0_0_20px_rgba(113,113,122,0.4)]',
      dot: 'bg-zinc-500 shadow-[0_0_8px_#71717a] group-hover:shadow-[0_0_25px_#71717a]'
    }
  };

  const current = colorClasses[color] || colorClasses.emerald;

  return (
    <div className="absolute top-3 right-3 z-20 flex items-center justify-center pointer-events-none">
      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full bg-black border transition-all duration-500 ${current.border} flex items-center justify-center relative overflow-hidden shadow-lg`}>
        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-500 ${current.dot} animate-pulse`}></div>
      </div>
    </div>
  );
};

export default CornerBubble;