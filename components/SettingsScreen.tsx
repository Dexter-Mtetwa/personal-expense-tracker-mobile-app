import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyPIN, setPIN, getRecoveryCode } from '../services/storage';

export default function SettingsScreen() {
    const [showChangePIN, setShowChangePIN] = useState(false);
    const [showRecoveryCode, setShowRecoveryCode] = useState(false);
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [verifyPinForRecovery, setVerifyPinForRecovery] = useState('');
    const [error, setError] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');

    const handleChangePINSubmit = async () => {
        setError('');

        // Verify current PIN
        const isCurrentValid = await verifyPIN(currentPin);
        if (!isCurrentValid) {
            setError('Current PIN is incorrect');
            return;
        }

        // Validate new PIN
        if (newPin.length < 4) {
            setError('New PIN must be at least 4 digits');
            return;
        }

        // Confirm match
        if (newPin !== confirmPin) {
            setError('New PINs do not match');
            return;
        }

        try {
            await setPIN(newPin);
            Alert.alert('Success', 'Your PIN has been changed successfully');
            setShowChangePIN(false);
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
        } catch (error) {
            setError('Failed to change PIN. Please try again.');
            console.error(error);
        }
    };

    const handleViewRecoveryCode = async () => {
        setError('');

        const isValid = await verifyPIN(verifyPinForRecovery);
        if (!isValid) {
            setError('Incorrect PIN');
            return;
        }

        try {
            const code = await getRecoveryCode();
            if (code) {
                setRecoveryCode(code);
                setVerifyPinForRecovery('');
                setShowRecoveryCode(true);
            } else {
                setError('Recovery code not found');
            }
        } catch (error) {
            setError('Failed to retrieve recovery code');
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setShowChangePIN(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingItemLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                <Ionicons name="lock-closed" size={24} color="#6366f1" />
                            </View>
                            <View>
                                <Text style={styles.settingItemTitle}>Change PIN</Text>
                                <Text style={styles.settingItemSubtitle}>Update your security PIN</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setShowRecoveryCode(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingItemLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                <Ionicons name="key" size={24} color="#f59e0b" />
                            </View>
                            <View>
                                <Text style={styles.settingItemTitle}>View Recovery Code</Text>
                                <Text style={styles.settingItemSubtitle}>See your PIN recovery code</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                {/* App Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingItemLeft}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Ionicons name="information-circle" size={24} color="#10b981" />
                            </View>
                            <View>
                                <Text style={styles.settingItemTitle}>Expense Tracker</Text>
                                <Text style={styles.settingItemSubtitle}>Version 2.0</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Change PIN Modal */}
            <Modal
                visible={showChangePIN}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowChangePIN(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change PIN</Text>
                            <TouchableOpacity onPress={() => {
                                setShowChangePIN(false);
                                setCurrentPin('');
                                setNewPin('');
                                setConfirmPin('');
                                setError('');
                            }}>
                                <Ionicons name="close" size={28} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Current PIN"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry={true}
                            keyboardType="numeric"
                            value={currentPin}
                            onChangeText={(text) => {
                                setCurrentPin(text);
                                setError('');
                            }}
                            maxLength={6}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="New PIN (at least 4 digits)"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry={true}
                            keyboardType="numeric"
                            value={newPin}
                            onChangeText={(text) => {
                                setNewPin(text);
                                setError('');
                            }}
                            maxLength={6}
                        />

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
                        />

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleChangePINSubmit}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.modalButtonText}>Change PIN</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* View Recovery Code Modal */}
            <Modal
                visible={showRecoveryCode}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowRecoveryCode(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {recoveryCode ? 'Your Recovery Code' : 'Verify PIN'}
                            </Text>
                            <TouchableOpacity onPress={() => {
                                setShowRecoveryCode(false);
                                setVerifyPinForRecovery('');
                                setRecoveryCode('');
                                setError('');
                            }}>
                                <Ionicons name="close" size={28} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {!recoveryCode ? (
                            <>
                                <Text style={styles.modalSubtitle}>
                                    Enter your PIN to view your recovery code
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter PIN"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry={true}
                                    keyboardType="numeric"
                                    value={verifyPinForRecovery}
                                    onChangeText={(text) => {
                                        setVerifyPinForRecovery(text);
                                        setError('');
                                    }}
                                    maxLength={6}
                                />

                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={handleViewRecoveryCode}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.modalButtonText}>View Code</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.recoveryCodeBox}>
                                    <Text style={styles.recoveryCodeText}>{recoveryCode}</Text>
                                </View>
                                <Text style={styles.warningText}>
                                    ⚠️ Keep this code safe. You'll need it to reset your PIN if you forget it.
                                </Text>
                            </>
                        )}
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
        marginTop: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    settingItemSubtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        color: '#1f2937',
        backgroundColor: '#f9fafb',
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    recoveryCodeBox: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginVertical: 20,
        borderWidth: 2,
        borderColor: '#6366f1',
    },
    recoveryCodeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        letterSpacing: 2,
    },
    warningText: {
        fontSize: 14,
        color: '#92400e',
        textAlign: 'center',
        lineHeight: 20,
    },
});
