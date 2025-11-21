import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Modal,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Animated,
    Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    getExpensesForCurrentMonth,
    getIncomeForCurrentMonth,
    calculateMonthlyTotals,
    deleteExpense,
    deleteIncome,
    updateExpense,
    updateIncome,
} from '../services/storage';
import { Expense } from '../types/expense';
import { Income } from '../types/income';

type Transaction = (Expense | Income) & { type: 'income' | 'expense' };

// --- Toast Component ---
const Toast = ({ message, type, visible, onHide }: { message: string, type: 'success' | 'error', visible: boolean, onHide: () => void }) => {
    const [opacity] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(2000),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => onHide());
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[
            styles.toastContainer,
            { opacity },
            type === 'success' ? styles.toastSuccess : styles.toastError
        ]}>
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

// --- Custom Confirmation Modal ---
const ConfirmationModal = ({ visible, title, message, onConfirm, onCancel }: { visible: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.confirmOverlay}>
                <View style={styles.confirmContent}>
                    <Text style={styles.confirmTitle}>{title}</Text>
                    <Text style={styles.confirmMessage}>{message}</Text>
                    <View style={styles.confirmButtons}>
                        <TouchableOpacity style={styles.confirmButtonCancel} onPress={onCancel}>
                            <Text style={styles.confirmButtonCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButtonDestructive} onPress={onConfirm}>
                            <Text style={styles.confirmButtonDestructiveText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// --- Options Menu Modal ---
const OptionsModal = ({ visible, onClose, onEdit, onDelete }: { visible: boolean, onClose: () => void, onEdit: () => void, onDelete: () => void }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.optionsOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.optionsContent}>
                    <TouchableOpacity style={styles.optionItem} onPress={onEdit}>
                        <Text style={styles.optionText}>Edit Transaction</Text>
                    </TouchableOpacity>
                    <View style={styles.optionDivider} />
                    <TouchableOpacity style={styles.optionItem} onPress={onDelete}>
                        <Text style={styles.optionTextDestructive}>Delete Transaction</Text>
                    </TouchableOpacity>
                    <View style={styles.optionDivider} />
                    <TouchableOpacity style={styles.optionItem} onPress={onClose}>
                        <Text style={styles.optionTextCancel}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default function AllTransactionsScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [totals, setTotals] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        incomeCount: 0,
        expenseCount: 0,
    });
    const [refreshing, setRefreshing] = useState(false);

    // Edit Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editDate, setEditDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Interaction State
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);
    const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);

    // Toast State
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ visible: true, message, type });
    };

    const loadData = useCallback(async () => {
        const [expenses, income, monthlyTotals] = await Promise.all([
            getExpensesForCurrentMonth(),
            getIncomeForCurrentMonth(),
            calculateMonthlyTotals(),
        ]);

        const combinedTransactions: Transaction[] = [
            ...income.map(item => ({ ...item, type: 'income' as const })),
            ...expenses.map(item => ({ ...item, type: 'expense' as const })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setTransactions(combinedTransactions);
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

    const handleLongPress = (item: Transaction) => {
        setSelectedTransaction(item);
        setIsOptionsVisible(true);
    };

    const handleOptionEdit = () => {
        setIsOptionsVisible(false);
        if (selectedTransaction) {
            openEditModal(selectedTransaction);
        }
    };

    const handleOptionDelete = () => {
        setIsOptionsVisible(false);
        setIsDeleteConfirmVisible(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedTransaction) return;

        try {
            if (selectedTransaction.type === 'income') {
                await deleteIncome(selectedTransaction.id);
            } else {
                await deleteExpense(selectedTransaction.id);
            }
            setIsDeleteConfirmVisible(false);
            showToast('Transaction deleted', 'success');
            await loadData();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            setIsDeleteConfirmVisible(false);
            showToast('Failed to delete transaction', 'error');
        }
    };

    const openEditModal = (item: Transaction) => {
        setEditingTransaction(item);
        setEditAmount(item.amount.toString());
        setEditDescription(item.description);
        setEditCategory(item.type === 'income' ? (item as Income).source : (item as Expense).category);
        setEditDate(new Date(item.date));
        setIsEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editingTransaction || !editAmount || !editDescription || !editCategory) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const amount = parseFloat(editAmount);
        if (isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        try {
            if (editingTransaction.type === 'income') {
                const updatedIncome: Income = {
                    id: editingTransaction.id,
                    amount,
                    description: editDescription,
                    source: editCategory,
                    date: editDate.toISOString(),
                };
                await updateIncome(updatedIncome);
            } else {
                const updatedExpense: Expense = {
                    id: editingTransaction.id,
                    amount,
                    description: editDescription,
                    category: editCategory,
                    date: editDate.toISOString(),
                };
                await updateExpense(updatedExpense);
            }
            setIsEditModalVisible(false);
            showToast('Transaction updated', 'success');
            await loadData();
        } catch (error) {
            console.error('Error updating transaction:', error);
            showToast('Failed to update transaction', 'error');
        }
    };

    const onDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (date) {
            setEditDate(date);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatAmount = (amount: number) => {
        return `$${amount.toFixed(2)}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Totals Section */}
                {transactions.length > 0 && (
                    <View style={styles.totalsSection}>
                        <View style={styles.totalRow}>
                            <View style={styles.totalCard}>
                                <Text style={styles.totalCardLabel}>Income</Text>
                                <Text style={[styles.totalCardAmount, styles.incomeText]}>
                                    {formatAmount(totals.totalIncome)}
                                </Text>
                                <Text style={styles.totalCardCount}>{totals.incomeCount} entries</Text>
                            </View>

                            <View style={styles.totalCard}>
                                <Text style={styles.totalCardLabel}>Expenses</Text>
                                <Text style={[styles.totalCardAmount, styles.expenseText]}>
                                    {formatAmount(totals.totalExpenses)}
                                </Text>
                                <Text style={styles.totalCardCount}>{totals.expenseCount} entries</Text>
                            </View>
                        </View>

                        <View style={[styles.balanceCard, totals.balance >= 0 ? styles.positiveBalance : styles.negativeBalance]}>
                            <Text style={styles.balanceLabel}>Balance</Text>
                            <Text style={styles.balanceAmount}>{formatAmount(totals.balance)}</Text>
                        </View>
                    </View>
                )}

                {/* Transactions List */}
                {transactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No transactions yet</Text>
                        <Text style={styles.emptyStateSubtext}>Add income or expenses to get started</Text>
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
                            <TouchableOpacity
                                style={[styles.transactionCard, item.type === 'income' && styles.incomeCard]}
                                onLongPress={() => handleLongPress(item)}
                                activeOpacity={0.9} // Slight feedback but no action on tap
                                delayLongPress={300}
                            >
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
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>

            {/* Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isEditModalVisible}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Transaction</Text>
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Amount</Text>
                            <TextInput
                                style={styles.input}
                                value={editAmount}
                                onChangeText={setEditAmount}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                            />

                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={styles.input}
                                value={editDescription}
                                onChangeText={setEditDescription}
                                placeholder="What was this for?"
                            />

                            <Text style={styles.inputLabel}>
                                {editingTransaction?.type === 'income' ? 'Source' : 'Category'}
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={editCategory}
                                onChangeText={setEditCategory}
                                placeholder={editingTransaction?.type === 'income' ? 'e.g., Salary' : 'e.g., Food'}
                            />

                            <Text style={styles.inputLabel}>Date</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.dateButtonText}>
                                    {editDate.toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={editDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                />
                            )}

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Options Modal */}
            <OptionsModal
                visible={isOptionsVisible}
                onClose={() => setIsOptionsVisible(false)}
                onEdit={handleOptionEdit}
                onDelete={handleOptionDelete}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                visible={isDeleteConfirmVisible}
                title="Delete Transaction"
                message="Are you sure you want to delete this transaction? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteConfirmVisible(false)}
            />

            {/* Toast Notification */}
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={() => setToast({ ...toast, visible: false })}
            />
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
        padding: 16,
    },
    totalsSection: {
        marginBottom: 24,
    },
    totalRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    totalCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    totalCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },
    totalCardAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    totalCardCount: {
        fontSize: 11,
        color: '#9ca3af',
    },
    incomeText: {
        color: '#10b981',
    },
    expenseText: {
        color: '#ef4444',
    },
    balanceCard: {
        backgroundColor: '#6366f1',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    positiveBalance: {
        backgroundColor: '#10b981',
    },
    negativeBalance: {
        backgroundColor: '#ef4444',
    },
    balanceLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
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
        marginBottom: 4,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    closeButton: {
        fontSize: 24,
        color: '#9ca3af',
        padding: 4,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 4,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        color: '#1f2937',
    },
    dateButton: {
        backgroundColor: '#f9fafb',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    dateButtonText: {
        fontSize: 16,
        color: '#1f2937',
    },
    saveButton: {
        backgroundColor: '#6366f1',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 12,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // Toast Styles
    toastContainer: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    toastSuccess: {
        backgroundColor: '#10b981',
    },
    toastError: {
        backgroundColor: '#ef4444',
    },
    toastText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    // Confirm Modal Styles
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    confirmContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
    },
    confirmMessage: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmButtonCancel: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    confirmButtonCancelText: {
        color: '#4b5563',
        fontWeight: '600',
        fontSize: 16,
    },
    confirmButtonDestructive: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
    },
    confirmButtonDestructiveText: {
        color: '#ef4444',
        fontWeight: '600',
        fontSize: 16,
    },
    // Options Modal Styles
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    optionsContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
    },
    optionItem: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    optionText: {
        fontSize: 18,
        color: '#1f2937',
        fontWeight: '500',
    },
    optionTextDestructive: {
        fontSize: 18,
        color: '#ef4444',
        fontWeight: '600',
    },
    optionTextCancel: {
        fontSize: 18,
        color: '#6b7280',
        fontWeight: '600',
    },
    optionDivider: {
        height: 1,
        backgroundColor: '#e5e7eb',
    },
});
