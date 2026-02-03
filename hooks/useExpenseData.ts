import { useState, useEffect, useCallback, useMemo } from 'react';
import { Expense, ExpenseStatus } from '../types';
import { INITIAL_EXPENSES, CATEGORIES as INITIAL_CATEGORIES } from '../constants';

const STORAGE_KEYS = {
    EXPENSES: 'natsumi_db_expenses_v1',
    CATEGORIES: 'natsumi_db_categories_v1',
    REVENUE: 'natsumi_db_revenue_v1',
    REVENUE_DATE: 'natsumi_db_rev_date_v1',
    REVENUE_START: 'natsumi_db_rev_start_v1',
    REVENUE_END: 'natsumi_db_rev_end_v1',
    ITEM_MAP: 'natsumi_db_item_map_v1',
    FILTER_START: 'natsumi_db_filter_start_v1',
    FILTER_END: 'natsumi_db_filter_end_v1'
};

export const useExpenseData = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
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

    const [revenueStartDate, setRevenueStartDate] = useState(() => {
        return localStorage.getItem(STORAGE_KEYS.REVENUE_START) || '2026-01-01';
    });

    const [revenueEndDate, setRevenueEndDate] = useState(() => {
        return localStorage.getItem(STORAGE_KEYS.REVENUE_END) || '2026-01-31';
    });

    const [itemCategoryMap, setItemCategoryMap] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.ITEM_MAP);
        return saved ? JSON.parse(saved) : {};
    });

    const [startDate, setStartDate] = useState(() => {
        return localStorage.getItem(STORAGE_KEYS.FILTER_START) || '2026-01-01';
    });

    const [endDate, setEndDate] = useState(() => {
        return localStorage.getItem(STORAGE_KEYS.FILTER_END) || '2026-01-31';
    });

    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const syncDatabase = useCallback(async (localOnly = false) => {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        localStorage.setItem(STORAGE_KEYS.REVENUE, revenue.toString());
        localStorage.setItem(STORAGE_KEYS.REVENUE_DATE, revenueDate);
        localStorage.setItem(STORAGE_KEYS.REVENUE_START, revenueStartDate);
        localStorage.setItem(STORAGE_KEYS.REVENUE_END, revenueEndDate);
        localStorage.setItem(STORAGE_KEYS.ITEM_MAP, JSON.stringify(itemCategoryMap));
        localStorage.setItem(STORAGE_KEYS.FILTER_START, startDate);
        localStorage.setItem(STORAGE_KEYS.FILTER_END, endDate);

        if (!localOnly && isOnline) {
            try {
                await fetch('/api/sync', {
                    method: 'POST',
                    body: JSON.stringify({
                        expenses,
                        revenue,
                        revenueDate,
                        revenueStartDate,
                        revenueEndDate,
                        filterStartDate: startDate,
                        filterEndDate: endDate
                    }),
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (e) {
                console.warn("DB Sync failed, will retry later", e);
            }
        }
    }, [expenses, categories, revenue, revenueDate, revenueStartDate, revenueEndDate, itemCategoryMap, startDate, endDate, isOnline]);

    // Initial Load
    useEffect(() => {
        const loadFromDB = async () => {
            try {
                const res = await fetch('/api/sync');
                if (res.ok) {
                    const data = await res.json();
                    if (data.expenses) setExpenses(data.expenses);
                    if (data.revenue !== undefined) setRevenue(data.revenue);
                    if (data.revenueDate) setRevenueDate(data.revenueDate);
                    if (data.revenueStartDate) setRevenueStartDate(data.revenueStartDate);
                    if (data.revenueEndDate) setRevenueEndDate(data.revenueEndDate);
                    if (data.filterStartDate) setStartDate(data.filterStartDate);
                    if (data.filterEndDate) setEndDate(data.filterEndDate);
                }
            } catch (e) {
                console.error("DB Initial Load Failed, using local storage/mock", e);
            } finally {
                setIsInitialLoad(false);
            }
        };
        loadFromDB();
    }, []);

    // Auto Sync on Change (Debounced could be better but this is fine for now as per previous logic)
    useEffect(() => {
        if (!isInitialLoad) {
            syncDatabase(true);
        }
    }, [expenses, categories, revenue, revenueDate, revenueStartDate, revenueEndDate, itemCategoryMap, startDate, endDate, isInitialLoad, syncDatabase]);


    const addOrEditExpense = (data: Partial<Expense>, editingId?: string) => {
        if (data.name && data.category) {
            setItemCategoryMap(prev => ({ ...prev, [data.name!]: data.category! }));
        }

        if (editingId) {
            setExpenses(prev => prev.map(exp => exp.id === editingId ? { ...exp, ...data } as Expense : exp));
        } else {
            const newExp: Expense = { ...data, id: Math.random().toString(36).substr(2, 9), status: ExpenseStatus.PAID } as Expense;
            setExpenses(prev => [...prev, newExp]);
        }
    };

    const deleteExpense = (id: string) => {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
    };

    const updateRevenue = (val: number, date: string, start: string, end: string) => {
        setRevenue(val);
        setRevenueDate(date);
        setRevenueStartDate(start);
        setRevenueEndDate(end);
    };

    return {
        expenses,
        categories,
        setCategories,
        revenue,
        revenueDate,
        revenueStartDate,
        revenueEndDate,
        itemCategoryMap,
        setItemCategoryMap,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        isOnline,
        isInitialLoad,
        syncDatabase,
        addOrEditExpense,
        deleteExpense,
        updateRevenue
    };
};
