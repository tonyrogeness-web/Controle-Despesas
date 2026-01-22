
export enum ExpenseStatus {
  PENDING = 'Pendente',
  PAID = 'Ativo',
  ARCHIVED = 'Arquivado',
}

export interface Expense {
  id: string;
  name: string;
  dueDate: string;
  value: number;
  status: ExpenseStatus;
  category: string;
}

export interface SummaryData {
  total: number;
  paidTotal: number;
  revenue: number;
  count: number;
}

export interface SavedReport {
  id: string;
  period: string;
  revenue: number;
  totalExpenses: number;
  profit: number;
  expenseCount: number;
  expenses: Expense[];
  savedAt: string;
}
