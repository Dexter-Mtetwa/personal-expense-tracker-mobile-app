import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getExpenses } from '../services/storage';
import { Expense } from '../types/expense';

export default function HomeScreen() {
    const router = useRouter();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadExpenses = useCallback(async () => {
        const data = await getExpenses();
        setExpenses(data.slice(0, 5)); // Get only the 5 most recent
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const calculateTotal = () => {
        return expenses.reduce((sum, expense) => sum + expense.amount, 0);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                    <Text style={styles.subtitle}>Track your expenses with ease</Text>

                    {expenses.length > 0 && (
                        <View style={styles.statsCard}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Recent Total</Text>
                                <Text style={styles.statValue}>{formatAmount(calculateTotal())}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Transactions</Text>
                                <Text style={styles.statValue}>{expenses.length}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Add Expense Button */}
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/add-expense')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.addButtonText}>+ Add New Expense</Text>
                </TouchableOpacity>

                {/* Recent Expenses Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>

                    {expenses.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No expenses yet</Text>
                            <Text style={styles.emptyStateSubtext}>Tap "Add New Expense" to get started</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={expenses}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
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

                {/* View All Button */}
                {expenses.length > 0 && (
                    <TouchableOpacity
                        style={styles.viewAllButton}
                        onPress={() => router.push('/all-expenses')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.viewAllButtonText}>View All Expenses →</Text>
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
        paddingTop: 12,
        marginHorizontal: 10,
        paddingBottom: 18,
        backgroundColor: '#6366f1',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
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
    },
    statsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#c7d2fe',
        marginBottom: 6,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 16,
    },
    addButton: {
        backgroundColor: '#6366f1',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 24,
        marginBottom: 24,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
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
    expenseCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
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
