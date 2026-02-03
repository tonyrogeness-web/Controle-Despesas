
import React, { useState, useEffect, useRef } from 'react';
import { Expense, ExpenseStatus } from '../types';
import { X, Save, Plus, Edit2, Trash2, ChevronDown, Check } from 'lucide-react';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Partial<Expense>) => void;
  onDelete?: (id: string) => void;
  initialData?: Expense | null;
  categories: string[];
  onAddCategory: (category: string) => void;
  existingItemNames?: string[];
  itemCategoryMap?: Record<string, string>;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Alimentação': ['mercado', 'alimento', 'comida', 'hortifruti', 'padaria', 'feira', 'restaurante'],
  'Estoque': ['insumo', 'oriental', 'camarao', 'camarão', 'cremcheese', 'bebida', 'embalagem', 'estoque', 'copo', 'sacola', 'canudo', 'peixe', 'arroz', 'alga', 'shoyu', 'wasabi'],
  'Logística': ['moto boy', 'motoboy', 'entrega', 'frete', 'logistica', 'combustivel', 'uber', 'correios'],
  'RH': ['pessoal', 'pgt', 'funcionario', 'funcionário', 'salario', 'salário', 'folha', 'vale', 'transporte', 'alimentacao', 'ferias', 'decimo', 'bonus'],
  'Manutenção': ['manutencao', 'manutenção', 'conserto', 'reparo', 'serviços', 'emplacamento', 'reforma', 'eletricista', 'pintor', 'hidraulica', 'ar condicionado'],
  'Impostos': ['imposto', 'das', 'simples', 'mei', 'taxa', 'alvara', 'licenciamento', 'gps', 'fgts', 'irrf', 'darf', 'iptu', 'iss'],
  'Infraestrutura': ['coelba', 'agua', 'luz', 'internet', 'aluguel', 'condominio', 'seguro', 'limpeza', 'seguranca', 'claro', 'vivo', 'oi', 'tim'],
  'Outros': ['extras', 'outros', 'patrocinado', 'marketing', 'instagram', 'facebook', 'ads', 'google', 'brinde', 'evento']
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete, 
  initialData, 
  categories, 
  onAddCategory,
  existingItemNames = [],
  itemCategoryMap = {}
}) => {
  const [formData, setFormData] = useState<Partial<Expense>>({
    name: '',
    value: 0,
    dueDate: new Date().toISOString().split('T')[0],
    category: categories[0],
    status: ExpenseStatus.PAID,
  });

  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        value: 0,
        dueDate: new Date().toISOString().split('T')[0],
        category: categories[0],
        status: ExpenseStatus.PAID,
      });
    }
    
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [initialData, isOpen, categories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!initialData && formData.name) {
      const currentName = formData.name;
      const lowerName = currentName.toLowerCase();
      
      if (itemCategoryMap[currentName]) {
        setFormData(prev => ({ ...prev, category: itemCategoryMap[currentName] }));
        return;
      }
      
      for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
          if (categories.includes(category)) {
            setFormData(prev => ({ ...prev, category }));
            break;
          }
        }
      }
    }
  }, [formData.name, initialData, categories, itemCategoryMap]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, status: ExpenseStatus.PAID });
    onClose();
  };

  const handleCreateCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const handleDelete = () => {
    if (initialData && onDelete) {
      onDelete(initialData.id);
      onClose();
    }
  };

  const filteredItems = existingItemNames.filter(name => 
    name.toLowerCase().includes((formData.name || '').toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-zinc-900 rounded-[2rem] md:rounded-[3rem] w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] border-2 border-white/10 animate-in zoom-in-95 duration-300 bubble-card custom-scrollbar">
        <div className="p-6 md:p-10 border-b-2 border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-xl md:rounded-2xl flex items-center justify-center border-2 border-emerald-500/30">
              {initialData ? <Edit2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" /> : <Plus className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />}
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black text-white uppercase tracking-[0.1em] md:tracking-[0.2em] italic leading-none">
                {initialData ? 'Modificar Registro' : 'Novo Lançamento'}
              </h2>
              <p className="text-[9px] md:text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1 md:mt-2">Terminal NATSUMI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-zinc-500 hover:text-white border-2 border-transparent hover:border-white/20">
            <X className="w-6 h-6 md:w-7 md:h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 md:space-y-8">
          <div className="space-y-3 relative" ref={dropdownRef}>
            <label htmlFor="expense-name" className="block text-[10px] md:text-[12px] font-black text-zinc-500 uppercase tracking-[0.2em] md:tracking-[0.3em] ml-1">Descrição do Item</label>
            <div className="relative">
              <input
                id="expense-name"
                name="name"
                ref={inputRef}
                type="text"
                required
                autoComplete="off"
                className="w-full px-5 md:px-6 py-4 md:py-5 rounded-xl md:rounded-2xl bg-black border-2 border-zinc-800 hover:border-white/30 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-800 font-bold uppercase tracking-widest text-xs md:text-sm shadow-inner"
                placeholder="SELECIONE OU DIGITE..."
                value={formData.name}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setShowDropdown(true);
                }}
              />
              <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
            </div>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-48 overflow-y-auto bg-zinc-900 border-2 border-emerald-500/30 rounded-xl shadow-2xl p-1 animate-in slide-in-from-top-2 custom-scrollbar">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, name: item });
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-400 flex items-center justify-between group/item transition-all"
                    >
                      {item}
                      {formData.name === item && <Check className="w-3 h-3 text-emerald-500" />}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center italic">
                    Detectando novo item...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3">
              <label htmlFor="expense-value" className="block text-[10px] md:text-[12px] font-black text-zinc-500 uppercase tracking-[0.2em] md:tracking-[0.3em] ml-1">Valor Bruto</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-600">R$</span>
                <input
                  id="expense-value"
                  name="value"
                  type="number"
                  step="0.01"
                  required
                  className="w-full pl-14 pr-6 py-4 md:py-5 rounded-xl md:rounded-2xl bg-black border-2 border-zinc-800 hover:border-white/30 text-white focus:border-emerald-500 outline-none transition-all font-black text-lg md:text-xl tracking-tighter shadow-inner"
                  value={formData.value || ''}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label htmlFor="expense-date" className="block text-[10px] md:text-[12px] font-black text-zinc-500 uppercase tracking-[0.2em] md:tracking-[0.3em] ml-1">Vencimento</label>
              <input
                id="expense-date"
                name="dueDate"
                type="date"
                required
                className="w-full px-5 md:px-6 py-4 md:py-5 rounded-xl md:rounded-2xl bg-black border-2 border-zinc-800 hover:border-white/30 text-white focus:border-emerald-500 outline-none transition-all shadow-inner font-bold text-sm"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-2">
              <label htmlFor="expense-category" className="block text-[10px] md:text-[12px] font-black text-zinc-500 uppercase tracking-[0.2em] md:tracking-[0.3em]">Grupo de Custos</label>
              <button 
                type="button" 
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-[9px] md:text-[11px] font-black text-emerald-500 uppercase hover:text-emerald-400 tracking-widest transition-colors border-b border-emerald-500/20 pb-0.5"
              >
                {showAddCategory ? '[ CANCELAR ]' : '[ + NOVO GRUPO ]'}
              </button>
            </div>
            
            {!showAddCategory ? (
              <div className="relative">
                <select
                  id="expense-category"
                  name="category"
                  className="w-full px-5 md:px-6 py-4 md:py-5 rounded-xl md:rounded-2xl bg-black border-2 border-zinc-800 hover:border-white/30 text-white focus:border-emerald-500 outline-none transition-all appearance-none uppercase text-[10px] md:text-[12px] font-black tracking-[0.1em] md:tracking-[0.2em] shadow-inner"
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value });
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 animate-in slide-in-from-right-2">
                <input
                  id="new-category-input"
                  name="newCategory"
                  type="text"
                  className="flex-1 px-5 md:px-6 py-4 md:py-5 rounded-xl md:rounded-2xl bg-black border-2 border-emerald-500/40 text-white outline-none text-[10px] md:text-[12px] font-black uppercase tracking-widest"
                  placeholder="NOME DO GRUPO..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  autoFocus
                />
                <button 
                  type="button"
                  onClick={handleCreateCategory}
                  className="w-full sm:w-auto px-8 py-4 sm:py-0 bg-emerald-500 border-2 border-emerald-400 rounded-xl md:rounded-2xl text-black font-black text-[10px] md:text-[12px] uppercase hover:bg-emerald-400 active:scale-95 transition-all bubble-btn"
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>

          <div className="pt-6 md:pt-10 flex flex-col gap-4 md:gap-5">
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
              <button
                type="button"
                onClick={onClose}
                className="order-2 sm:order-1 flex-1 px-6 py-4 md:py-5 border-2 border-zinc-950 hover:border-white/20 rounded-xl md:rounded-2xl text-zinc-500 font-black uppercase text-[10px] md:text-[12px] tracking-[0.2em] hover:bg-white/5 transition-all active:scale-95 bubble-btn"
              >
                Descartar
              </button>
              <button
                type="submit"
                className="order-1 sm:order-2 flex-[1.5] px-6 py-4 md:py-5 bg-white text-black border-2 border-transparent hover:border-emerald-500 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-[12px] tracking-[0.2em] hover:bg-emerald-400 flex items-center justify-center gap-3 transition-all active:scale-95 bubble-btn"
              >
                <Check className="w-4 h-4 md:w-5 md:h-5" />
                {initialData ? 'Atualizar' : 'Lançar'}
              </button>
            </div>

            {initialData && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-6 py-4 md:py-5 bg-red-600/5 border-2 border-red-500/30 hover:border-red-400 text-red-500 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-[12px] tracking-[0.1em] md:tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-4 group active:scale-95 bubble-btn"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                Remover permanentemente
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
