import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyRecoveryCode, setPIN, setRecoveryCode } from '../services/storage';

interface ForgotPINScreenProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ForgotPINScreen({ onSuccess, onCancel }: ForgotPINScreenProps) {
    const [step, setStep] = useState<'recovery' | 'newpin' | 'confirm'>('recovery');
    const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerifyRecoveryCode = async () => {
        if (!recoveryCodeInput.trim()) {
            setError('Please enter your recovery code');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            const isValid = await verifyRecoveryCode(recoveryCodeInput);
            if (isValid) {
                setStep('newpin');
            } else {
                setError('Invalid recovery code. Please try again.');
                setRecoveryCodeInput('');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
            console.error(error);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleNewPinSubmit = () => {
        if (newPin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }
        setError('');
        setStep('confirm');
    };

    const handleConfirmSubmit = async () => {
        if (confirmPin !== newPin) {
            setError('PINs do not match. Please try again.');
            setConfirmPin('');
            return;
        }

        try {
            await setPIN(newPin);
            // Generate new recovery code after reset
            const newRecoveryCode = await setRecoveryCode();

            Alert.alert(
                'PIN Reset Successful',
                `Your PIN has been reset.\n\nNew Recovery Code:\n${newRecoveryCode}\n\nPlease save this new code in a safe place.`,
                [
                    {
                        text: 'OK',
                        onPress: onSuccess
                    }
                ]
            );
        } catch (error) {
            setError('Failed to reset PIN. Please try again.');
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    {/* Header with back button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onCancel}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#6366f1" />
                        <Text style={styles.backButtonText}>Back to Login</Text>
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={step === 'recovery' ? 'key' : 'lock-open'}
                            size={80}
                            color="#6366f1"
                        />
                    </View>

                    <Text style={styles.title}>
                        {step === 'recovery' && 'Forgot PIN'}
                        {step === 'newpin' && 'Create New PIN'}
                        {step === 'confirm' && 'Confirm New PIN'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'recovery' && 'Enter your recovery code to reset your PIN'}
                        {step === 'newpin' && 'Enter your new PIN'}
                        {step === 'confirm' && 'Re-enter your new PIN to confirm'}
                    </Text>

                    <View style={styles.spacer} />

                    {/* Step 1: Enter Recovery Code */}
                    {step === 'recovery' && (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Recovery Code (e.g., XXXX-XXXX)"
                                placeholderTextColor="#9ca3af"
                                value={recoveryCodeInput}
                                onChangeText={(text) => {
                                    setRecoveryCodeInput(text.toUpperCase());
                                    setError('');
                                }}
                                maxLength={9} // 8 chars + 1 dash
                                autoCapitalize="characters"
                                autoFocus
                            />
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                            <TouchableOpacity
                                style={[styles.button, isVerifying && styles.buttonDisabled]}
                                onPress={handleVerifyRecoveryCode}
                                activeOpacity={0.8}
                                disabled={isVerifying}
                            >
                                <Text style={styles.buttonText}>
                                    {isVerifying ? 'Verifying...' : 'Verify Code'}
                                </Text>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Step 2: Enter New PIN */}
                    {step === 'newpin' && (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter New PIN (at least 4 digits)"
                                placeholderTextColor="#9ca3af"
                                secureTextEntry={true}
                                keyboardType="numeric"
                                value={newPin}
                                onChangeText={(text) => {
                                    setNewPin(text);
                                    setError('');
                                }}
                                maxLength={6}
                                autoFocus
                            />
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleNewPinSubmit}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buttonText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Step 3: Confirm New PIN */}
                    {step === 'confirm' && (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm New PIN"
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
                                <Text style={styles.buttonText}>Reset PIN</Text>
                                <Ionicons name="checkmark" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    )}
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
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 10,
    },
    backButtonText: {
        color: '#6366f1',
        fontSize: 16,
        fontWeight: '500',
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
});
