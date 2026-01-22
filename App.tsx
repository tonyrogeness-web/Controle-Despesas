import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Expense, ExpenseStatus, SummaryData } from './types';
import { INITIAL_EXPENSES, CATEGORIES as INITIAL_CATEGORIES } from './constants';
import SummaryCards from './components/SummaryCards';
import ExpenseTable from './components/ExpenseTable';
import ExpenseForm from './components/ExpenseForm';
import CornerBubble from './components/CornerBubble';
import { 
  Plus, Search, Calendar, Database, 
  Landmark, BarChart3, 
  ShieldCheck, FileSpreadsheet,
  Maximize2, Cpu, 
  ArrowUpRight, X, CheckCircle2, Save, Wifi, WifiOff,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, Legend, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, LabelList
} from 'recharts';

const STORAGE_KEYS = {
  EXPENSES: 'natsumi_db_expenses_v1',
  CATEGORIES: 'natsumi_db_categories_v1',
  REVENUE: 'natsumi_db_revenue_v1',
  REVENUE_DATE: 'natsumi_db_rev_date_v1',
  ITEM_MAP: 'natsumi_db_item_map_v1'
};

const playBip = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio Context failed", e);
  }
};

const ModernLogo = () => (
  <div className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 group">
    <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-2xl group-hover:bg-emerald-500/30 transition-all duration-700 animate-pulse"></div>
    <div className="absolute inset-0 border border-emerald-500/20 rounded-2xl rotate-45 group-hover:rotate-90 transition-transform duration-1000"></div>
    <div className="absolute inset-0 border border-emerald-500/40 rounded-xl -rotate-12 group-hover:rotate-0 transition-transform duration-700 bg-emerald-950/10 backdrop-blur-sm"></div>
    <div className="relative z-10 w-9 h-9 md:w-11 md:h-11 bg-black border-2 border-emerald-500/50 rounded-xl flex items-center justify-center shadow-[4px_-4px_10px_rgba(16,185,129,0.2)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
      <Database className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500" />
      <div className="absolute top-1 right-1 w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentView, setCurrentView] = useState<'current' | 'analytics'>('current');
  const [expandedChart, setExpandedChart] = useState<'pie' | 'bar' | null>(null);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [manualSaveStatus, setManualSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [revenue, setRevenue] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REVENUE);
    return saved ? parseFloat(saved) : 0;
  });

  const [revenueDate, setRevenueDate] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.REVENUE_DATE) || '2026-01-31';
  });

  const [itemCategoryMap, setItemCategoryMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ITEM_MAP);
    return saved ? JSON.parse(saved) : {};
  });

  const [tempRevenue, setTempRevenue] = useState<number>(revenue);
  const [tempRevenueDate, setTempRevenueDate] = useState<string>(revenueDate);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const revInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setEditingExpense(null);
        setIsFormOpen(true);
      }
      if (e.key === 'Escape') {
        setIsFormOpen(false);
        setEditingExpense(null);
        setIsRevenueModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isRevenueModalOpen) {
      setTimeout(() => {
        if (revInputRef.current) {
          revInputRef.current.focus();
          revInputRef.current.setSelectionRange(0, 0);
        }
      }, 100);
    }
  }, [isRevenueModalOpen]);

  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const data = await res.json();
          if (data.expenses && data.expenses.length > 0) {
            setExpenses(data.expenses);
            setRevenue(data.revenue);
            setTempRevenue(data.revenue);
          }
        }
      } catch (e) {
        console.error("DB Initial Load Failed, using local storage/mock", e);
      } finally {
        setIsInitialLoad(false);
      }
    };
    loadFromDB();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  const syncDatabase = useCallback(async (localOnly = false) => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    localStorage.setItem(STORAGE_KEYS.REVENUE, revenue.toString());
    localStorage.setItem(STORAGE_KEYS.REVENUE_DATE, revenueDate);
    localStorage.setItem(STORAGE_KEYS.ITEM_MAP, JSON.stringify(itemCategoryMap));
    
    if (!localOnly && isOnline) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          body: JSON.stringify({ expenses, revenue }),
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        console.warn("DB Sync failed, will retry later", e);
      }
    }
  }, [expenses, categories, revenue, revenueDate, itemCategoryMap, isOnline]);

  useEffect(() => {
    if (!isInitialLoad) {
      syncDatabase(true); 
    }
  }, [expenses, categories, revenue, revenueDate, itemCategoryMap, isInitialLoad, syncDatabase]);

  const handleManualSave = async () => {
    setManualSaveStatus('saving');
    playBip();
    await syncDatabase(false); 
    setTimeout(() => {
      setManualSaveStatus('saved');
      setTimeout(() => setManualSaveStatus('idle'), 2500);
    }, 800);
  };

  const existingItemNames = useMemo(() => {
    return Array.from(new Set(expenses.map(exp => exp.name))).sort();
  }, [expenses]);

  const activeExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const isNotArchived = exp.status !== ExpenseStatus.ARCHIVED;
      const matchesSearch = exp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           exp.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = exp.dueDate >= startDate && exp.dueDate <= endDate;
      return isNotArchived && matchesSearch && matchesDate;
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [expenses, searchTerm, startDate, endDate]);

  const summary: SummaryData = useMemo(() => {
    const total = activeExpenses.reduce((acc, curr) => acc + curr.value, 0);
    const paidTotal = activeExpenses.reduce((acc, curr) => curr.status === ExpenseStatus.PAID ? acc + curr.value : acc, 0);
    return { total, paidTotal, revenue, count: activeExpenses.length };
  }, [activeExpenses, revenue]);

  const pieData = useMemo(() => {
    const groups: Record<string, { value: number; category: string; dates: string[] }> = {};
    activeExpenses.forEach(exp => {
      const key = exp.name;
      if (!groups[key]) groups[key] = { value: 0, category: exp.category, dates: [] };
      groups[key].value += exp.value;
      const formattedDate = exp.dueDate.split('-').reverse().slice(0, 2).join('/');
      if (!groups[key].dates.includes(formattedDate)) groups[key].dates.push(formattedDate);
    });
    return Object.entries(groups)
      .map(([name, data]) => ({ name, value: data.value, category: data.category, dates: data.dates }))
      .sort((a, b) => b.value - a.value);
  }, [activeExpenses]);

  const comparisonData = useMemo(() => {
    const netIncome = revenue - summary.total;
    return [
      { name: 'FATURAMENTO', value: revenue, fill: '#3b82f6' },
      { name: 'CUSTOS', value: summary.total, fill: '#ef4444' },
      { name: 'LUCRO LÍQUIDO', value: netIncome, fill: '#10b981' }
    ];
  }, [revenue, summary.total]);

  const CHART_COLORS = ['#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#14b8a6', '#06b6d4', '#f97316'];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleAddOrEdit = (data: Partial<Expense>) => {
    if (data.name && data.category) {
      setItemCategoryMap(prev => ({ ...prev, [data.name!]: data.category! }));
    }

    if (editingExpense) {
      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? { ...exp, ...data } as Expense : exp));
    } else {
      const newExp: Expense = { ...data, id: Math.random().toString(36).substr(2, 9), status: ExpenseStatus.PAID } as Expense;
      setExpenses(prev => [...prev, newExp]);
      playBip();
    }
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    playBip();
  };

  const handleSaveRevenue = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setRevenue(tempRevenue);
      setRevenueDate(tempRevenueDate);
      setSaveStatus('success');
      playBip();
      setTimeout(() => {
        setIsRevenueModalOpen(false);
        setSaveStatus('idle');
      }, 1000);
    }, 600);
  };

  const exportToExcel = () => {
    const title = ["NATSUMI DATABASE - RELATÓRIO FINANCEIRO"];
    const headers = ["ITEM", "CATEGORIA", "VENCIMENTO", "VALOR (R$)"];
    const rows = activeExpenses.map(exp => [exp.name.toUpperCase(), exp.category.toUpperCase(), formatDate(exp.dueDate), exp.value.toFixed(2).replace('.', ',')]);
    const csvContent = [title, headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NATSUMI_EXPORT_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl min-w-[240px] bubble-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-emerald-500 font-black uppercase tracking-[0.2em] text-[12px]">{data.name}</p>
          </div>
          <p className="text-white font-black text-2xl tracking-tighter mb-4">{formatCurrency(data.value)}</p>
          <div className="space-y-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Categoria:</p>
              <p className="text-[12px] text-zinc-100 uppercase font-black tracking-widest bg-white/5 py-1.5 px-3 rounded-lg border border-white/10 w-fit">{data.category}</p>
            </div>
            {data.dates && data.dates.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Período:</p>
                <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">Ref: {data.dates.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-zinc-300 pb-20 selection:bg-emerald-500/30">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      {expandedChart && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-900/50 border-4 border-white/10 rounded-[2rem] md:rounded-[3rem] w-full h-full max-w-6xl flex flex-col p-6 md:p-10 relative overflow-hidden shadow-2xl bubble-card">
            <div className="flex items-center justify-between mb-6 md:mb-10">
              <h2 className="text-sm md:text-xl font-black text-white uppercase tracking-[0.2em] md:tracking-[0.4em] italic">
                {expandedChart === 'bar' ? "Faturamento vs Despesas" : "Análise Estratégica"}
              </h2>
              <button onClick={() => setExpandedChart(null)} className="p-2 md:p-4 bg-white/5 hover:bg-red-500 text-white rounded-xl md:rounded-2xl transition-all border-2 border-transparent hover:border-white/20 bubble-btn"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
            </div>
            <div className="flex-1 w-full overflow-hidden">
              {expandedChart === 'pie' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={window.innerWidth < 768 ? 60 : 140} outerRadius={window.innerWidth < 768 ? 100 : 220} paddingAngle={8} dataKey="value" nameKey="name" label={window.innerWidth > 768 ? ({name, value}) => `${name}: ${formatCurrency(value)}` : false}>
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(0,0,0,0.6)" strokeWidth={3} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#fff', fontWeight: 'black', textTransform: 'uppercase', fontSize: '8px', md: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="6 6" stroke="#222" vertical={false} />
                    <XAxis dataKey="name" stroke="#fff" fontSize={window.innerWidth < 768 ? 8 : 14} fontWeight="black" />
                    <YAxis stroke="#555" fontSize={window.innerWidth < 768 ? 8 : 14} tickFormatter={(val) => `R$${val / 1000}k`} />
                    <Tooltip cursor={false} contentStyle={{ backgroundColor: '#000', border: '2px solid rgba(16,185,129,0.3)', borderRadius: '20px' }} formatter={(value: number) => [formatCurrency(value), 'Valor']} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={window.innerWidth < 768 ? 40 : 200}>
                      {comparisonData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      <LabelList dataKey="value" position="top" content={(props: any) => {
                        const { x, y, width, value } = props;
                        return <text x={x + width / 2} y={y - 10} fill="#fff" textAnchor="middle" fontSize={window.innerWidth < 768 ? 10 : 16} fontWeight="black">{window.innerWidth < 768 ? `R$${(value/1000).toFixed(0)}k` : formatCurrency(value)}</text>;
                      }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {isRevenueModalOpen && (
        <div className="fixed inset-0 z-[101] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-zinc-900 rounded-[2.5rem] md:rounded-[3rem] w-full max-w-md shadow-2xl border-2 border-white/10 hover:border-white/30 transition-all overflow-hidden relative group bubble-card">
            <CornerBubble />
            <div className="p-6 md:p-10 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <h3 className="text-white font-black uppercase tracking-widest italic text-sm md:text-base">Lançar Novo Aporte</h3>
              <button onClick={() => setIsRevenueModalOpen(false)} className="text-zinc-500 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 md:p-10 space-y-6 md:space-y-8">
              <div className="space-y-3">
                <label htmlFor="rev-amount" className="text-[10px] md:text-[11px] font-black text-zinc-500 uppercase tracking-widest">Valor Bruto (BRL)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-600">R$</span>
                  <input 
                    id="rev-amount"
                    ref={revInputRef}
                    name="revenueAmount"
                    type="text" 
                    inputMode="decimal"
                    className="w-full bg-black border-2 border-zinc-800 rounded-2xl pl-14 pr-6 py-4 md:py-5 text-xl md:text-2xl font-black text-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-inner" 
                    value={tempRevenue} 
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      if (val === '' || !isNaN(Number(val))) {
                        setTempRevenue(val === '' ? 0 : parseFloat(val));
                      }
                    }} 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label htmlFor="rev-date" className="text-[10px] md:text-[11px] font-black text-zinc-500 uppercase tracking-widest">Data do Aporte</label>
                <input 
                  id="rev-date"
                  name="revenueDate"
                  type="date" 
                  className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-6 py-4 md:py-5 text-white focus:border-emerald-500 outline-none font-bold transition-all shadow-inner" 
                  value={tempRevenueDate} 
                  onChange={(e) => setTempRevenueDate(e.target.value)} 
                />
              </div>
              <button 
                onClick={handleSaveRevenue} 
                disabled={saveStatus !== 'idle'}
                className={`w-full py-4 md:py-5 rounded-2xl font-black uppercase text-[11px] md:text-[12px] tracking-[0.2em] shadow-xl transition-all active:scale-95 group relative overflow-hidden flex items-center justify-center gap-3 bubble-btn ${saveStatus === 'success' ? 'bg-white text-black' : 'bg-emerald-500 text-black hover:bg-emerald-400'}`}
              >
                {saveStatus === 'idle' && 'Confirmar Lançamento'}
                {saveStatus === 'saving' && <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>}
                {saveStatus === 'success' && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Salvo com Sucesso
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-black/95 border-b-2 border-emerald-500/20 backdrop-blur-3xl px-4 md:px-6 py-4 md:py-5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-4">
              <ModernLogo />
              <div>
                <h1 className="text-lg md:text-2xl font-black text-white tracking-tighter uppercase italic leading-none">NATSUMI <span className="text-emerald-500">DATABASE</span></h1>
                <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-2">
                  <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" />
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] md:text-[11px] font-bold text-zinc-400 uppercase tracking-widest italic">Controle</span>
                    <div className="flex items-center gap-1.5">
                      {isOnline ? (
                        <>
                          <Wifi className="w-3 h-3 text-emerald-500" />
                          <span className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase">Synced</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3 text-red-500" />
                          <span className="text-[8px] md:text-[9px] font-black text-red-500 uppercase">Local</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.1em] text-right block lg:hidden italic">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="flex items-center bg-zinc-900/80 p-1 rounded-2xl border-2 border-white/5 shadow-inner w-full lg:w-auto justify-center">
            <button onClick={() => setCurrentView('current')} className={`flex-1 lg:flex-none px-4 md:px-10 py-2.5 md:py-3 rounded-xl text-[10px] md:text-[12px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 md:gap-3 bubble-btn ${currentView === 'current' ? 'bg-emerald-500 text-black shadow-xl ring-2 ring-emerald-400/50' : 'text-zinc-500 hover:text-white'}`}><Cpu className="w-4 h-4" />Operações</button>
            <button onClick={() => setCurrentView('analytics')} className={`flex-1 lg:flex-none px-4 md:px-10 py-2.5 md:py-3 rounded-xl text-[10px] md:text-[12px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 md:gap-3 bubble-btn ${currentView === 'analytics' ? 'bg-emerald-500 text-black shadow-xl ring-2 ring-emerald-400/50' : 'text-zinc-500 hover:text-white'}`}><BarChart3 className="w-4 h-4" />Insights</button>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 md:gap-4 w-full lg:w-auto">
            <button 
              onClick={handleManualSave} 
              title="Sincronizar Banco de Dados"
              disabled={manualSaveStatus !== 'idle'}
              className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 transition-all shadow-2xl active:scale-95 bubble-btn ${manualSaveStatus === 'saved' ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-zinc-900 border-white/10 text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}
            >
              <Save className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Salvar</span>
            </button>

            <div className="flex flex-col items-center gap-1.5">
              <button onClick={() => { setEditingExpense(null); setIsFormOpen(true); }} className="bg-white text-black hover:bg-emerald-400 border-2 border-transparent hover:border-white/40 px-5 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[12px] uppercase transition-all shadow-2xl active:scale-95 flex items-center gap-2 md:gap-3 group relative overflow-hidden bubble-btn">
                <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Novo Lançamento</span><span className="sm:hidden">Novo</span>
              </button>
              <div className="text-[8px] md:text-[9px] font-black text-emerald-500/80 uppercase tracking-[0.1em] italic leading-none whitespace-nowrap">
                {currentTime.toLocaleDateString('pt-BR')} - {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            <div className="flex flex-row lg:flex-col gap-2">
              <button 
                onClick={scrollToTop} 
                className="p-3 bg-zinc-900 text-zinc-500 border-2 border-white/5 rounded-xl transition-all shadow-2xl active:scale-95 hover:bg-emerald-500/10 hover:border-emerald-500 hover:text-emerald-500 bubble-btn"
                title="Topo"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button 
                onClick={scrollToBottom} 
                className="p-3 bg-zinc-900 text-zinc-500 border-2 border-white/5 rounded-xl transition-all shadow-2xl active:scale-95 hover:bg-emerald-500/10 hover:border-emerald-500 hover:text-emerald-500 bubble-btn"
                title="Fim"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 bg-[#1c1c1c]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12 relative">
          <div className="glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-4 border-white/10 hover:border-white/30 transition-all group shadow-2xl relative overflow-hidden hover:-translate-y-1 active:scale-[0.99] bubble-card">
            <CornerBubble color="zinc" />
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400 italic">Período de Análise</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8">
              <div className="w-full sm:flex-1 space-y-2 md:space-y-3">
                <label htmlFor="filter-start" className="text-[9px] md:text-[11px] text-zinc-500 font-black uppercase tracking-wider">Início</label>
                <input id="filter-start" name="startDate" type="date" className="w-full bg-black border-2 border-zinc-800 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-white focus:border-emerald-500 outline-none font-bold transition-all shadow-inner text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="w-full sm:flex-1 space-y-2 md:space-y-3">
                <label htmlFor="filter-end" className="text-[9px] md:text-[11px] text-zinc-500 font-black uppercase tracking-wider">Fim</label>
                <input id="filter-end" name="endDate" type="date" className="w-full bg-black border-2 border-zinc-800 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-white focus:border-emerald-500 outline-none font-bold transition-all shadow-inner text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="glass rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-4 border-white/10 hover:border-white/30 flex flex-col md:flex-row items-center justify-between gap-6 relative group overflow-hidden shadow-2xl hover:-translate-y-1 transition-all active:scale-[0.99] bubble-card">
            <CornerBubble color="emerald" />
            <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-500/10 rounded-xl md:rounded-2xl flex items-center justify-center border-2 border-emerald-500/30 group-hover:border-emerald-400 transition-colors shadow-inner shrink-0">
                <Landmark className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
              </div>
              <div className="flex-1 flex flex-col relative overflow-hidden">
                <span className="text-[9px] md:text-[11px] font-black text-zinc-500 uppercase block mb-1 tracking-widest italic">Faturamento</span>
                <div className="flex flex-col">
                  <div className="text-2xl md:text-4xl font-black text-white tracking-tighter drop-shadow-md truncate">{formatCurrency(revenue)}</div>
                  <div className="flex flex-col mt-1 md:mt-2">
                    <span className="text-[8px] md:text-[10px] text-zinc-700 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                      DATA_LAYER
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative z-10 w-full md:w-auto flex flex-row md:flex-col gap-2 justify-center">
              <button 
                onClick={() => setIsRevenueModalOpen(true)} 
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400/30 hover:border-white/50 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-[9px] font-black uppercase relative active:scale-95 bubble-btn"
              >
                 <ArrowUpRight className="w-3 h-3" />
                 Atualizar
              </button>
              <button onClick={exportToExcel} className="flex-1 md:flex-none bg-zinc-800 hover:bg-emerald-500 text-zinc-400 hover:text-black border-2 border-white/5 hover:border-white/40 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-[9px] font-black uppercase relative bubble-btn">
                <FileSpreadsheet className="w-3 h-3" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {isInitialLoad ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
             <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-500">Iniciando Link de Dados...</span>
          </div>
        ) : (
          <>
            <SummaryCards summary={summary} />

            {currentView === 'current' ? (
              <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 px-2 mt-8 md:mt-16">
                  <h2 className="text-[11px] md:text-[13px] font-black text-white uppercase tracking-[0.2em] md:tracking-[0.4em] italic flex items-center gap-5">Fluxo de Operações</h2>
                  <div className="relative group w-full sm:w-auto">
                    <label htmlFor="main-search-input" className="sr-only">Localizar Operações</label>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 md:w-5 md:h-5 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      id="main-search-input"
                      name="mainSearch"
                      type="text" 
                      placeholder="LOCALIZAR..." 
                      className="pl-12 pr-6 py-3 md:py-4 bg-zinc-900/60 border-2 border-zinc-800 rounded-xl md:rounded-2xl text-[10px] md:text-[12px] font-bold text-white outline-none focus:border-emerald-500 transition-all w-full md:w-80 uppercase tracking-widest shadow-lg" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="group overflow-hidden">
                  <ExpenseTable expenses={activeExpenses} onDelete={handleDeleteExpense} onEdit={(exp) => { setEditingExpense(exp); setIsFormOpen(true); }} />
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 space-y-8 md:space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                  <div className="glass rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border-4 border-white/10 hover:border-white/30 flex flex-col items-center relative group shadow-2xl hover:-translate-y-1 transition-all bubble-card">
                    <CornerBubble color="emerald" />
                    <button onClick={() => setExpandedChart('pie')} className="absolute bottom-6 md:bottom-8 right-6 md:right-8 p-3 md:p-4 bg-white/5 hover:bg-emerald-500 text-white rounded-xl md:rounded-2xl transition-all border-2 border-transparent hover:border-white/40 shadow-xl z-20 bubble-btn"><Maximize2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                    <div className="w-full h-[300px] md:h-[450px]">
                      <h3 className="text-[10px] md:text-[12px] font-black text-white uppercase tracking-[0.2em] md:tracking-[0.3em] mb-4 text-center italic">Despesas por Descritivo</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={pieData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={window.innerWidth < 768 ? 50 : 90} 
                            outerRadius={window.innerWidth < 768 ? 80 : 140} 
                            paddingAngle={6} 
                            dataKey="value" 
                            nameKey="name"
                          >
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />)}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '10px', fontSize: '9px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border-4 border-white/10 hover:border-white/30 relative group shadow-2xl hover:-translate-y-1 transition-all bubble-card">
                    <CornerBubble color="emerald" />
                    <button onClick={() => setExpandedChart('bar')} className="absolute bottom-6 md:bottom-8 right-6 md:right-8 p-3 md:p-4 bg-white/5 hover:bg-emerald-500 text-white rounded-xl md:rounded-2xl transition-all border-2 border-transparent hover:border-white/40 shadow-xl z-20 bubble-btn"><Maximize2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                    <div className="w-full h-[300px] md:h-[450px]">
                      <h3 className="text-[10px] md:text-[12px] font-black text-white uppercase tracking-[0.2em] md:tracking-[0.35em] mb-4 text-center italic uppercase">Relacional Financeiro</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="4 4" stroke="#1a1a1a" vertical={false} />
                          <XAxis dataKey="name" stroke="#888" fontSize={8} fontWeight="black" tick={{ fill: '#fff' }} />
                          <YAxis stroke="#555" fontSize={8} tickFormatter={(val) => `R$${val / 1000}k`} />
                          <Tooltip cursor={false} contentStyle={{ backgroundColor: '#000', border: '2px solid rgba(16,185,129,0.3)', borderRadius: '20px' }} formatter={(value: number) => [formatCurrency(value), 'Valor']} />
                          <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={window.innerWidth < 768 ? 30 : 120}>
                            {comparisonData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <ExpenseForm 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setEditingExpense(null); }} 
        onSubmit={handleAddOrEdit} 
        onDelete={handleDeleteExpense} 
        initialData={editingExpense} 
        categories={categories} 
        onAddCategory={(cat) => setCategories(prev => [...prev, cat])}
        existingItemNames={existingItemNames}
        itemCategoryMap={itemCategoryMap}
      />
    </div>
  );
};

export default App;