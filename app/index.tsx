import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    getExpensesForCurrentMonth,
    getIncomeForCurrentMonth,
    getCurrentMonthPeriod,
    calculateMonthlyTotals
} from '../services/storage';
import { Expense } from '../types/expense';
import { Income } from '../types/income';
import { MonthPeriod } from '../types/monthPeriod';

type Transaction = (Expense | Income) & { type: 'income' | 'expense' };

export default function HomeScreen() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [monthPeriod, setMonthPeriod] = useState<MonthPeriod | null>(null);
    const [totals, setTotals] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        incomeCount: 0,
        expenseCount: 0,
    });
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        const [expenses, income, period, monthlyTotals] = await Promise.all([
            getExpensesForCurrentMonth(),
            getIncomeForCurrentMonth(),
            getCurrentMonthPeriod(),
            calculateMonthlyTotals(),
        ]);

        // Combine and sort transactions
        const combinedTransactions: Transaction[] = [
            ...income.map(item => ({ ...item, type: 'income' as const })),
            ...expenses.map(item => ({ ...item, type: 'expense' as const })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setTransactions(combinedTransactions.slice(0, 5)); // Get only 5 most recent
        setMonthPeriod(period);
        setTotals(monthlyTotals);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatAmount = (amount: number) => {
        return `$${amount.toFixed(2)}`;
    };

    const formatPeriodDates = () => {
        if (!monthPeriod) return 'No active period';
        const start = new Date(monthPeriod.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const end = new Date(monthPeriod.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${start} - ${end}`;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                    <TouchableOpacity onPress={() => router.push('/periods')} activeOpacity={0.7}>
                        <Text style={styles.subtitle}>
                            {monthPeriod ? formatPeriodDates() : 'No active period - Tap to create'}
                        </Text>
                    </TouchableOpacity>

                    {/* Monthly Totals Card */}
                    <View style={styles.totalsCard}>
                        <View style={styles.totalItem}>
                            <Text style={styles.totalLabel}>Income</Text>
                            <Text style={[styles.totalValue, styles.incomeText]}>
                                {formatAmount(totals.totalIncome)}
                            </Text>
                        </View>
                        <View style={styles.totalDivider} />
                        <View style={styles.totalItem}>
                            <Text style={styles.totalLabel}>Expenses</Text>
                            <Text style={[styles.totalValue, styles.expenseText]}>
                                {formatAmount(totals.totalExpenses)}
                            </Text>
                        </View>
                        <View style={styles.totalDivider} />
                        <View style={styles.totalItem}>
                            <Text style={styles.totalLabel}>Balance</Text>
                            <Text style={[styles.totalValue, totals.balance >= 0 ? styles.incomeText : styles.expenseText]}>
                                {formatAmount(totals.balance)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.incomeButton]}
                        onPress={() => router.push('/add-income')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.actionButtonText}>+ Add Income</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.expenseButton]}
                        onPress={() => router.push('/add-expense')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.actionButtonText}>+ Add Expense</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Activity Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>

                    {transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No transactions yet</Text>
                            <Text style={styles.emptyStateSubtext}>Tap "Add Income" or "Add Expense" to get started</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={transactions}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                            renderItem={({ item }) => (
                                <View style={[styles.transactionCard, item.type === 'income' && styles.incomeCard]}>
                                    <View style={styles.transactionHeader}>
                                        <Text style={styles.transactionDescription}>{item.description}</Text>
                                        <Text style={[
                                            styles.transactionAmount,
                                            item.type === 'income' ? styles.incomeAmount : styles.expenseAmount
                                        ]}>
                                            {item.type === 'income' ? '+' : '-'}{formatAmount(item.amount)}
                                        </Text>
                                    </View>
                                    <View style={styles.transactionFooter}>
                                        <View style={[
                                            styles.categoryBadge,
                                            item.type === 'income' ? styles.incomeBadge : styles.expenseBadge
                                        ]}>
                                            <Text style={[
                                                styles.categoryText,
                                                item.type === 'income' ? styles.incomeBadgeText : styles.expenseBadgeText
                                            ]}>
                                                {item.type === 'income' ? (item as Income).source : (item as Expense).category}
                                            </Text>
                                        </View>
                                        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </View>

                {/* View All Button */}
                {transactions.length > 0 && (
                    <TouchableOpacity
                        style={styles.viewAllButton}
                        onPress={() => router.push('/all-transactions')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.viewAllButtonText}>View All Transactions →</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 24,
        marginHorizontal: 10,
        paddingBottom: 18,
        marginTop: -20,
        backgroundColor: '#6366f1',
        borderRadius: 32,
        // borderBottomRightRadius: 32,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 3,
    },
    subtitle: {
        fontSize: 14,
        color: '#c7d2fe',
        marginBottom: 16,
        textDecorationLine: 'underline',
    },
    totalsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    totalItem: {
        flex: 1,
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 11,
        color: '#c7d2fe',
        marginBottom: 6,
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    totalDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 12,
    },
    incomeText: {
        color: '#10b981',
    },
    expenseText: {
        color: '#ef4444',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    incomeButton: {
        backgroundColor: '#10b981',
    },
    expenseButton: {
        backgroundColor: '#ef4444',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1f2937',
    },
    transactionCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    incomeCard: {
        borderLeftColor: '#10b981',
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    transactionDescription: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1,
    },
    transactionAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    incomeAmount: {
        color: '#10b981',
    },
    expenseAmount: {
        color: '#ef4444',
    },
    transactionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    incomeBadge: {
        backgroundColor: '#d1fae5',
    },
    expenseBadge: {
        backgroundColor: '#fee2e2',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    incomeBadgeText: {
        color: '#059669',
    },
    expenseBadgeText: {
        color: '#dc2626',
    },
    transactionDate: {
        fontSize: 12,
        color: '#6b7280',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyStateText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 15,
        color: '#d1d5db',
    },
    viewAllButton: {
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#6366f1',
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    viewAllButtonText: {
        color: '#6366f1',
        fontSize: 16,
        fontWeight: '700',
    },
});
