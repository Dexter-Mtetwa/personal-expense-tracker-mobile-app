import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, Alert, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setupPIN } from '../services/storage';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

interface PINSetupScreenProps {
    onComplete: () => void;
}

const { width } = Dimensions.get('window');

export default function PINSetupScreen({ onComplete }: PINSetupScreenProps) {
    const [step, setStep] = useState<'enter' | 'confirm' | 'recovery'>('enter');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');
    const [error, setError] = useState('');
    const [hasConfirmedSave, setHasConfirmedSave] = useState(false);
    const { toast, showToast, hideToast } = useToast();

    const handlePinSubmit = () => {
        if (pin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }
        setError('');
        setStep('confirm');
    };

    const handleConfirmSubmit = () => {
        if (confirmPin !== pin) {
            setError('PINs do not match. Please try again.');
            setConfirmPin('');
            return;
        }
        setError('');
        handleSetupPIN();
    };

    const handleSetupPIN = async () => {
        try {
            const code = await setupPIN(pin);
            setRecoveryCode(code);
            setStep('recovery');
        } catch (error) {
            setError('Failed to setup PIN. Please try again.');
            console.error(error);
        }
    };

    const handleCopyRecoveryCode = () => {
        Clipboard.setString(recoveryCode);
        showToast('Recovery code copied to clipboard', 'success');
    };

    const handleComplete = () => {
        if (!hasConfirmedSave) {
            Alert.alert(
                'Important',
                'Please confirm that you have saved your recovery code. You will need it if you forget your PIN.',
                [{ text: 'OK' }]
            );
            return;
        }
        onComplete();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={step === 'recovery' ? 'shield-checkmark' : 'lock-closed'}
                            size={80}
                            color="#6366f1"
                        />
                    </View>
                    <Text style={styles.title}>
                        {step === 'enter' && 'Create Your PIN'}
                        {step === 'confirm' && 'Confirm Your PIN'}
                        {step === 'recovery' && 'Save Recovery Code'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'enter' && 'Keep your expenses secure with a personal PIN'}
                        {step === 'confirm' && 'Re-enter your PIN to confirm'}
                        {step === 'recovery' && 'Save this code to recover your PIN if forgotten'}
                    </Text>

                    <View style={styles.spacer} />

                    {/* Step 1: Enter PIN */}
                    {step === 'enter' && (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter PIN (at least 4 digits)"
                                placeholderTextColor="#9ca3af"
                                secureTextEntry={true}
                                keyboardType="numeric"
                                value={pin}
                                onChangeText={(text) => {
                                    setPin(text);
                                    setError('');
                                }}
                                maxLength={6}
                                autoFocus
                            />
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handlePinSubmit}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buttonText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Step 2: Confirm PIN */}
                    {step === 'confirm' && (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm PIN"
                                placeholderTextColor="#9ca3af"
                                secureTextEntry={true}
                                keyboardType="numeric"
                                value={confirmPin}
                                onChangeText={(text) => {
                                    setConfirmPin(text);
                                    setError('');
                                }}
                                maxLength={6}
                                autoFocus
                            />
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleConfirmSubmit}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buttonText}>Confirm</Text>
                                <Ionicons name="checkmark" size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => {
                                    setStep('enter');
                                    setConfirmPin('');
                                    setError('');
                                }}
                            >
                                <Text style={styles.backButtonText}>← Back</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Step 3: Recovery Code */}
                    {step === 'recovery' && (
                        <>
                            <View style={styles.recoveryContainer}>
                                <View style={styles.recoveryCodeBox}>
                                    <Text style={styles.recoveryCodeLabel}>Your Recovery Code</Text>
                                    <Text style={styles.recoveryCodeText}>{recoveryCode}</Text>
                                    <TouchableOpacity
                                        style={styles.copyButton}
                                        onPress={handleCopyRecoveryCode}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="copy-outline" size={20} color="#6366f1" />
                                        <Text style={styles.copyButtonText}>Copy Code</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.warningBox}>
                                    <Ionicons name="warning" size={24} color="#f59e0b" />
                                    <Text style={styles.warningText}>
                                        Save this code in a safe place. You'll need it to reset your PIN if you forget it.
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.checkboxContainer}
                                    onPress={() => setHasConfirmedSave(!hasConfirmedSave)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.checkbox, hasConfirmedSave && styles.checkboxChecked]}>
                                        {hasConfirmedSave && <Ionicons name="checkmark" size={18} color="#fff" />}
                                    </View>
                                    <Text style={styles.checkboxLabel}>
                                        I have saved my recovery code
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, !hasConfirmedSave && styles.buttonDisabled]}
                                onPress={handleComplete}
                                activeOpacity={0.8}
                                disabled={!hasConfirmedSave}
                            >
                                <Text style={styles.buttonText}>Get Started</Text>
                                <Ionicons name="rocket" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={hideToast}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 40,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 40,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    spacer: {
        height: 20,
    },
    input: {
        width: '100%',
        maxWidth: 350,
        height: 50,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 18,
        color: '#1f2937',
        backgroundColor: '#fff',
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 15,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#6366f1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        maxWidth: 350,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        gap: 10,
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0.1,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    backButton: {
        marginTop: 15,
    },
    backButtonText: {
        color: '#6366f1',
        fontSize: 16,
    },
    recoveryContainer: {
        width: '100%',
        maxWidth: 350,
        marginBottom: 30,
    },
    recoveryCodeBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#6366f1',
        marginBottom: 20,
    },
    recoveryCodeLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 10,
    },
    recoveryCodeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        letterSpacing: 2,
        marginBottom: 15,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    copyButtonText: {
        color: '#6366f1',
        fontSize: 14,
        fontWeight: '600',
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 12,
        padding: 15,
        gap: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    warningText: {
        flex: 1,
        color: '#92400e',
        fontSize: 14,
        lineHeight: 20,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 15,
        color: '#374151',
    },
});
