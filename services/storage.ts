import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from '../types/expense';

const STORAGE_KEY = '@expense_tracker_expenses';

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

export const clearExpenses = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing expenses:', error);
    }
};
