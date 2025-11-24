import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyPIN } from '../services/storage';

interface AuthScreenProps {
    onAuthenticate: () => void;
    onForgotPIN?: () => void;
}

const { width } = Dimensions.get('window');

export default function AuthScreen({ onAuthenticate, onForgotPIN }: AuthScreenProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleUnlock = async () => {
        if (pin.length < 4) {
            setError('Please enter your PIN');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            const isValid = await verifyPIN(pin);
            if (isValid) {
                onAuthenticate();
            } else {
                setError('Incorrect PIN. Please try again.');
                setPin('');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
            console.error(error);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="lock-closed-outline" size={80} color="#6366f1" />
                </View>
                <Text style={styles.title}>Expense Tracker</Text>
                <Text style={styles.subtitle}>Secure & Private</Text>
                <View style={styles.spacer} />
                <TextInput
                    style={styles.input}
                    placeholder="Enter PIN"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={true}
                    keyboardType="numeric"
                    value={pin}
                    onChangeText={setPin}
                    maxLength={6}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <TouchableOpacity
                    style={[styles.authButton, isVerifying && styles.authButtonDisabled]}
                    onPress={handleUnlock}
                    activeOpacity={0.8}
                    disabled={isVerifying}
                >
                    <Ionicons name="key-outline" size={24} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.authButtonText}>
                        {isVerifying ? 'Verifying...' : 'Unlock'}
                    </Text>
                </TouchableOpacity>

                {onForgotPIN && (
                    <TouchableOpacity
                        style={styles.forgotPINButton}
                        onPress={onForgotPIN}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.forgotPINText}>Forgot PIN?</Text>
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
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
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 40,
    },
    spacer: {
        height: 20,
    },
    input: {
        width: '80%',
        height: 50,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 18,
        color: '#1f2937',
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 10,
    },
    authButton: {
        backgroundColor: '#6366f1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        maxWidth: 300,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonIcon: {
        marginRight: 12,
    },
    authButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    authButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0.1,
    },
    forgotPINButton: {
        marginTop: 20,
        paddingVertical: 10,
    },
    forgotPINText: {
        color: '#6366f1',
        fontSize: 16,
        fontWeight: '500',
    },
});
