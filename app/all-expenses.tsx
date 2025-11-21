import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getExpenses } from '../services/storage';
import { Expense } from '../types/expense';

export default function AllExpensesScreen() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadExpenses = useCallback(async () => {
        const data = await getExpenses();
        setExpenses(data);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadExpenses();
        }, [loadExpenses])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadExpenses();
        setRefreshing(false);
    }, [loadExpenses]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatAmount = (amount: number) => {
        return `$${amount.toFixed(2)}`;
    };

    const calculateTotal = () => {
        return expenses.reduce((sum, expense) => sum + expense.amount, 0);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Total Section */}
                {expenses.length > 0 && (
                    <View style={styles.totalCard}>
                        <Text style={styles.totalLabel}>Total Expenses</Text>
                        <Text style={styles.totalAmount}>{formatAmount(calculateTotal())}</Text>
                        <Text style={styles.totalCount}>{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</Text>
                    </View>
                )}

                {/* Expenses List */}
                {expenses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No expenses yet</Text>
                        <Text style={styles.emptyStateSubtext}>Add an expense to get started</Text>
                    </View>
                ) : (
                    <FlatList
                        data={expenses}
                        keyExtractor={(item) => item.id}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        renderItem={({ item }) => (
                            <View style={styles.expenseCard}>
                                <View style={styles.expenseHeader}>
                                    <Text style={styles.expenseDescription}>{item.description}</Text>
                                    <Text style={styles.expenseAmount}>{formatAmount(item.amount)}</Text>
                                </View>
                                <View style={styles.expenseFooter}>
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryText}>{item.category}</Text>
                                    </View>
                                    <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
                                </View>
                            </View>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    totalCard: {
        backgroundColor: '#6366f1',
        padding: 24,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#c7d2fe',
        marginBottom: 8,
    },
    totalAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    totalCount: {
        fontSize: 14,
        color: '#c7d2fe',
    },
    expenseCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    expenseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    expenseDescription: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1,
    },
    expenseAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ef4444',
        marginLeft: 8,
    },
    expenseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBadge: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        color: '#6366f1',
        fontSize: 12,
        fontWeight: '600',
    },
    expenseDate: {
        fontSize: 12,
        color: '#6b7280',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#d1d5db',
    },
});
