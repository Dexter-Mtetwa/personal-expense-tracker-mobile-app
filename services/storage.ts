import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from '../types/expense';
import { Income } from '../types/income';
import { MonthPeriod, createMonthPeriod, isPeriodExpired, isDateInPeriod } from '../types/monthPeriod';

const STORAGE_KEY = '@expense_tracker_expenses';
const INCOME_STORAGE_KEY = '@expense_tracker_income';
const PERIODS_KEY = '@expense_tracker_periods'; // Changed to plural to store array
const MONTH_PERIOD_KEY = '@expense_tracker_month_period'; // Legacy key kept for safety

// ============ EXPENSE FUNCTIONS ============

export const getExpenses = async (): Promise<Expense[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error('Error getting expenses:', error);
        return [];
    }
};

export const addExpense = async (expense: Omit<Expense, 'id'>): Promise<void> => {
    try {
        const expenses = await getExpenses();
        const newExpense: Expense = {
            ...expense,
            id: Date.now().toString(),
        };
        expenses.unshift(newExpense); // Add to beginning
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
        console.error('Error adding expense:', error);
        throw error;
    }
};

export const updateExpense = async (updatedExpense: Expense): Promise<void> => {
    try {
        const expenses = await getExpenses();
        const index = expenses.findIndex(e => e.id === updatedExpense.id);
        if (index !== -1) {
            expenses[index] = updatedExpense;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
        }
    } catch (error) {
        console.error('Error updating expense:', error);
        throw error;
    }
};

export const deleteExpense = async (id: string): Promise<void> => {
    try {
        const expenses = await getExpenses();
        const filteredExpenses = expenses.filter(e => e.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredExpenses));
    } catch (error) {
        console.error('Error deleting expense:', error);
        throw error;
    }
};

export const clearExpenses = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing expenses:', error);
    }
};

// ============ INCOME FUNCTIONS ============

export const getIncome = async (): Promise<Income[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(INCOME_STORAGE_KEY);
        return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error('Error getting income:', error);
        return [];
    }
};

export const addIncome = async (income: Omit<Income, 'id'>): Promise<void> => {
    try {
        const allIncome = await getIncome();
        const newIncome: Income = {
            ...income,
            id: Date.now().toString(),
        };

        // Check if we need to create a new month period
        // REMOVED: Auto-creation logic. User now manually creates periods.
        /*
        const currentPeriod = await getCurrentMonthPeriod();
        if (!currentPeriod) {
            // First income ever - create new month period
            await createNewMonthPeriod(new Date());
        } else if (isPeriodExpired(currentPeriod)) {
            // Period expired - create new month period
            await createNewMonthPeriod(new Date());
        }
        */

        allIncome.unshift(newIncome); // Add to beginning
        await AsyncStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(allIncome));
    } catch (error) {
        console.error('Error adding income:', error);
        throw error;
    }
};

export const updateIncome = async (updatedIncome: Income): Promise<void> => {
    try {
        const allIncome = await getIncome();
        const index = allIncome.findIndex(i => i.id === updatedIncome.id);
        if (index !== -1) {
            allIncome[index] = updatedIncome;
            await AsyncStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(allIncome));
        }
    } catch (error) {
        console.error('Error updating income:', error);
        throw error;
    }
};

export const deleteIncome = async (id: string): Promise<void> => {
    try {
        const allIncome = await getIncome();
        const filteredIncome = allIncome.filter(i => i.id !== id);
        await AsyncStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(filteredIncome));
    } catch (error) {
        console.error('Error deleting income:', error);
        throw error;
    }
};

export const clearIncome = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(INCOME_STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing income:', error);
    }
};

// ============ MONTH PERIOD FUNCTIONS ============

/**
 * Get all periods sorted by start date (newest first)
 */
export const getAllPeriods = async (): Promise<MonthPeriod[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(PERIODS_KEY);
        const periods = jsonValue ? JSON.parse(jsonValue) : [];
        // Sort by start date descending (newest first)
        return periods.sort((a: MonthPeriod, b: MonthPeriod) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
    } catch (error) {
        console.error('Error getting periods:', error);
        return [];
    }
};

/**
 * Get the currently active period
 */
export const getActivePeriod = async (): Promise<MonthPeriod | null> => {
    try {
        const periods = await getAllPeriods();
        return periods.find(p => p.isActive) || null;
    } catch (error) {
        console.error('Error getting active period:', error);
        return null;
    }
};

/**
 * Set a period as active (deactivates all others)
 */
export const setActivePeriod = async (periodId: string): Promise<void> => {
    try {
        const periods = await getAllPeriods();
        const updatedPeriods = periods.map(p => ({
            ...p,
            isActive: p.id === periodId,
        }));
        await AsyncStorage.setItem(PERIODS_KEY, JSON.stringify(updatedPeriods));
    } catch (error) {
        console.error('Error setting active period:', error);
        throw error;
    }
};

/**
 * Create a new custom period with specified start date
 */
export const createCustomPeriod = async (startDate: Date, customName?: string): Promise<MonthPeriod> => {
    try {
        const periods = await getAllPeriods();

        // Deactivate all existing periods
        const updatedPeriods = periods.map(p => ({ ...p, isActive: false }));

        // Create new period as active
        const newPeriod = createMonthPeriod(startDate, customName, true);
        updatedPeriods.unshift(newPeriod);

        await AsyncStorage.setItem(PERIODS_KEY, JSON.stringify(updatedPeriods));
        return newPeriod;
    } catch (error) {
        console.error('Error creating custom period:', error);
        throw error;
    }
};

/**
 * Delete a period by ID
 */
export const deletePeriod = async (periodId: string): Promise<void> => {
    try {
        const periods = await getAllPeriods();
        const filteredPeriods = periods.filter(p => p.id !== periodId);

        // If we deleted the active period and there are others, activate the most recent one
        const deletedPeriod = periods.find(p => p.id === periodId);
        if (deletedPeriod?.isActive && filteredPeriods.length > 0) {
            filteredPeriods[0].isActive = true;
        }

        await AsyncStorage.setItem(PERIODS_KEY, JSON.stringify(filteredPeriods));
    } catch (error) {
        console.error('Error deleting period:', error);
        throw error;
    }
};

/**
 * Legacy function for backward compatibility - gets active period
 * @deprecated Use getActivePeriod instead
 */
export const getCurrentMonthPeriod = async (): Promise<MonthPeriod | null> => {
    return getActivePeriod();
};

/**
 * Legacy function for backward compatibility - creates new period
 * @deprecated Use createCustomPeriod instead
 */
export const createNewMonthPeriod = async (startDate: Date): Promise<MonthPeriod> => {
    return createCustomPeriod(startDate);
};

// ============ FILTERED DATA FUNCTIONS ============

export const getExpensesForCurrentMonth = async (): Promise<Expense[]> => {
    try {
        const period = await getActivePeriod();
        if (!period) return [];

        const allExpenses = await getExpenses();
        return allExpenses.filter(expense => isDateInPeriod(expense.date, period));
    } catch (error) {
        console.error('Error getting expenses for current month:', error);
        return [];
    }
};

export const getIncomeForCurrentMonth = async (): Promise<Income[]> => {
    try {
        const period = await getActivePeriod();
        if (!period) return [];

        const allIncome = await getIncome();
        return allIncome.filter(income => isDateInPeriod(income.date, period));
    } catch (error) {
        console.error('Error getting income for current month:', error);
        return [];
    }
};

/**
 * Get expenses for a specific period
 */
export const getExpensesForPeriod = async (periodId: string): Promise<Expense[]> => {
    try {
        const periods = await getAllPeriods();
        const period = periods.find(p => p.id === periodId);
        if (!period) return [];

        const allExpenses = await getExpenses();
        return allExpenses.filter(expense => isDateInPeriod(expense.date, period));
    } catch (error) {
        console.error('Error getting expenses for period:', error);
        return [];
    }
};

/**
 * Get income for a specific period
 */
export const getIncomeForPeriod = async (periodId: string): Promise<Income[]> => {
    try {
        const periods = await getAllPeriods();
        const period = periods.find(p => p.id === periodId);
        if (!period) return [];

        const allIncome = await getIncome();
        return allIncome.filter(income => isDateInPeriod(income.date, period));
    } catch (error) {
        console.error('Error getting income for period:', error);
        return [];
    }
};

// ============ CALCULATION FUNCTIONS ============

export const calculateMonthlyTotals = async () => {
    try {
        const income = await getIncomeForCurrentMonth();
        const expenses = await getExpensesForCurrentMonth();

        const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const balance = totalIncome - totalExpenses;

        return {
            totalIncome,
            totalExpenses,
            balance,
            incomeCount: income.length,
            expenseCount: expenses.length,
        };
    } catch (error) {
        console.error('Error calculating monthly totals:', error);
        return {
            totalIncome: 0,
            totalExpenses: 0,
            balance: 0,
            incomeCount: 0,
            expenseCount: 0,
        };
    }
};

/**
 * Calculate stats for a specific period
 */
export const calculateStatsForPeriod = async (periodId: string) => {
    try {
        const income = await getIncomeForPeriod(periodId);
        const expenses = await getExpensesForPeriod(periodId);

        const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const balance = totalIncome - totalExpenses;

        return {
            totalIncome,
            totalExpenses,
            balance,
            incomeCount: income.length,
            expenseCount: expenses.length,
        };
    } catch (error) {
        console.error('Error calculating stats for period:', error);
        return {
            totalIncome: 0,
            totalExpenses: 0,
            balance: 0,
            incomeCount: 0,
            expenseCount: 0,
        };
    }
};
