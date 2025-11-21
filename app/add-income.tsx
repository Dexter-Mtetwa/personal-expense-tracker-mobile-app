import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addIncome } from '../services/storage';
import { INCOME_SOURCES } from '../types/income';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function AddIncomeScreen() {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [source, setSource] = useState('Salary');
    const { toast, showToast, hideToast } = useToast();

    const handleSubmit = async () => {
        if (!amount || !description) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        try {
            await addIncome({
                amount: amountNum,
                description,
                source,
                date: new Date().toISOString(),
            });
            showToast('Income added successfully!', 'success');
            setTimeout(() => router.back(), 1500);
        } catch (error) {
            showToast('Failed to add income', 'error');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={hideToast}
            />
            <ScrollView style={styles.content}>
                <View style={styles.form}>
                    {/* Amount Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Amount ($)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>

                    {/* Description Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Monthly Salary, Freelance Project"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* Source Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Source</Text>
                        <View style={styles.sourceContainer}>
                            {INCOME_SOURCES.map((src) => (
                                <TouchableOpacity
                                    key={src}
                                    style={[
                                        styles.sourceButton,
                                        source === src && styles.sourceButtonActive,
                                    ]}
                                    onPress={() => setSource(src)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.sourceButtonText,
                                            source === src && styles.sourceButtonTextActive,
                                        ]}
                                    >
                                        {src}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.submitButtonText}>Add Income</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    form: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    sourceContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sourceButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    sourceButtonActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    sourceButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    sourceButtonTextActive: {
        color: '#fff',
    },
    submitButton: {
        backgroundColor: '#10b981',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
