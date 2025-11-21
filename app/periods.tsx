import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    RefreshControl,
    Platform,
    Modal,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    getAllPeriods,
    getActivePeriod,
    setActivePeriod,
    createCustomPeriod,
    deletePeriod,
    calculateStatsForPeriod,
} from '../services/storage';
import { MonthPeriod } from '../types/monthPeriod';

interface PeriodWithStats extends MonthPeriod {
    stats: {
        totalIncome: number;
        totalExpenses: number;
        balance: number;
        incomeCount: number;
        expenseCount: number;
    };
}

const { width } = Dimensions.get('window');

export default function PeriodsScreen() {
    const router = useRouter();
    const [periods, setPeriods] = useState<PeriodWithStats[]>([]);
    const [activePeriod, setActivePeriodState] = useState<MonthPeriod | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [customName, setCustomName] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);

    const loadPeriods = useCallback(async () => {
        const [allPeriods, active] = await Promise.all([
            getAllPeriods(),
            getActivePeriod(),
        ]);

        // Load stats for each period
        const periodsWithStats = await Promise.all(
            allPeriods.map(async (period) => ({
                ...period,
                stats: await calculateStatsForPeriod(period.id),
            }))
        );

        setPeriods(periodsWithStats);
        setActivePeriodState(active);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPeriods();
        }, [loadPeriods])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadPeriods();
        setRefreshing(false);
    }, [loadPeriods]);

    const handleCreatePeriod = async () => {
        try {
            await createCustomPeriod(selectedDate, customName || undefined);
            setCustomName('');
            setShowDatePicker(false);
            setIsModalVisible(false);
            await loadPeriods();
            Alert.alert('Success', 'Period created successfully!');
        } catch (error) {
            console.error('Error creating period:', error);
            Alert.alert('Error', 'Failed to create period');
        }
    };

    const handleSetActive = async (periodId: string) => {
        try {
            await setActivePeriod(periodId);
            await loadPeriods();
        } catch (error) {
            console.error('Error setting active period:', error);
            Alert.alert('Error', 'Failed to set active period');
        }
    };

    const handleDeletePeriod = (period: MonthPeriod) => {
        Alert.alert(
            'Delete Period',
            `Are you sure you want to delete "${period.name}"? This will not delete your transactions.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePeriod(period.id);
                            await loadPeriods();
                        } catch (error) {
                            console.error('Error deleting period:', error);
                            Alert.alert('Error', 'Failed to delete period');
                        }
                    },
                },
            ]
        );
    };

    const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const onDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (date) {
            setSelectedDate(date);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Active Period Card */}
                {activePeriod && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Active Period</Text>
                        <View style={styles.activePeriodCard}>
                            <View style={styles.activePeriodHeader}>
                                <Text style={styles.activePeriodName}>{activePeriod.name}</Text>
                                <View style={styles.activeBadge}>
                                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                                </View>
                            </View>
                            <Text style={styles.activePeriodDates}>
                                {formatDate(activePeriod.startDate)} - {formatDate(activePeriod.endDate)}
                            </Text>
                            {periods.find(p => p.id === activePeriod.id) && (
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Income</Text>
                                        <Text style={[styles.statValue, styles.incomeText]}>
                                            {formatAmount(
                                                periods.find(p => p.id === activePeriod.id)!.stats.totalIncome
                                            )}
                                        </Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Expenses</Text>
                                        <Text style={[styles.statValue, styles.expenseText]}>
                                            {formatAmount(
                                                periods.find(p => p.id === activePeriod.id)!.stats.totalExpenses
                                            )}
                                        </Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Balance</Text>
                                        <Text
                                            style={[
                                                styles.statValue,
                                                periods.find(p => p.id === activePeriod.id)!.stats.balance >= 0
                                                    ? styles.incomeText
                                                    : styles.expenseText,
                                            ]}
                                        >
                                            {formatAmount(
                                                periods.find(p => p.id === activePeriod.id)!.stats.balance
                                            )}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* All Periods List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>All Periods</Text>
                    {periods.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No periods yet</Text>
                            <Text style={styles.emptyStateSubtext}>Create your first period to get started</Text>
                        </View>
                    ) : (
                        periods.map((period) => (
                            <TouchableOpacity
                                key={period.id}
                                style={[
                                    styles.periodCard,
                                    period.isActive && styles.activePeriodCardBorder,
                                ]}
                                onPress={() => !period.isActive && handleSetActive(period.id)}
                                onLongPress={() => handleDeletePeriod(period)}
                                activeOpacity={period.isActive ? 1 : 0.7}
                            >
                                <View style={styles.periodHeader}>
                                    <View style={styles.periodHeaderLeft}>
                                        <Text style={styles.periodName}>{period.name}</Text>
                                        {period.isActive && (
                                            <View style={styles.activeIndicator}>
                                                <Text style={styles.activeIndicatorText}>●</Text>
                                            </View>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleDeletePeriod(period)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Text style={styles.deleteButton}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.periodDates}>
                                    {formatDate(period.startDate)} - {formatDate(period.endDate)}
                                </Text>
                                <View style={styles.periodStatsRow}>
                                    <View style={styles.periodStat}>
                                        <Text style={styles.periodStatLabel}>Income</Text>
                                        <Text style={[styles.periodStatValue, styles.incomeText]}>
                                            {formatAmount(period.stats.totalIncome)}
                                        </Text>
                                    </View>
                                    <View style={styles.periodStat}>
                                        <Text style={styles.periodStatLabel}>Expenses</Text>
                                        <Text style={[styles.periodStatValue, styles.expenseText]}>
                                            {formatAmount(period.stats.totalExpenses)}
                                        </Text>
                                    </View>
                                    <View style={styles.periodStat}>
                                        <Text style={styles.periodStatLabel}>Balance</Text>
                                        <Text
                                            style={[
                                                styles.periodStatValue,
                                                period.stats.balance >= 0 ? styles.incomeText : styles.expenseText,
                                            ]}
                                        >
                                            {formatAmount(period.stats.balance)}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setIsModalVisible(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Create Period Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create New Period</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Period Name (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., January 2025"
                            placeholderTextColor="#9ca3af"
                            value={customName}
                            onChangeText={setCustomName}
                        />

                        <Text style={styles.inputLabel}>Start Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.dateButtonText}>
                                {selectedDate.toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                            />
                        )}

                        <TouchableOpacity style={styles.createButton} onPress={handleCreatePeriod}>
                            <Text style={styles.createButtonText}>Create Period</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1f2937',
    },
    activePeriodCard: {
        backgroundColor: '#6366f1',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    activePeriodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    activePeriodName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
    },
    activeBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    activeBadgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
    activePeriodDates: {
        fontSize: 14,
        color: '#c7d2fe',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        padding: 16,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    statDivider: {
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
    periodCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activePeriodCardBorder: {
        borderColor: '#6366f1',
    },
    periodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    periodHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    periodName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    activeIndicator: {
        marginLeft: 8,
    },
    activeIndicatorText: {
        color: '#6366f1',
        fontSize: 16,
    },
    deleteButton: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
    },
    periodDates: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 12,
    },
    periodStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    periodStat: {
        flex: 1,
    },
    periodStatLabel: {
        fontSize: 11,
        color: '#9ca3af',
        marginBottom: 4,
        fontWeight: '600',
    },
    periodStatValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabText: {
        color: '#ffffff',
        fontSize: 32,
        fontWeight: '400',
        marginTop: -2,
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
    createButton: {
        backgroundColor: '#6366f1',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
