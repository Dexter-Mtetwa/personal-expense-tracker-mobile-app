import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StatusBar as RNStatusBar, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AuthScreen from '../components/AuthScreen';
import PINSetupScreen from '../components/PINSetupScreen';
import ForgotPINScreen from '../components/ForgotPINScreen';
import { hasPINSetup } from '../services/storage';

export default function RootLayout() {
    const router = useRouter();
    const [hasSetupPIN, setHasSetupPIN] = useState<boolean | null>(null); // null = loading
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showForgotPIN, setShowForgotPIN] = useState(false);
    const insets = useSafeAreaInsets();

    // Check if PIN is already setup on mount
    useEffect(() => {
        checkPINSetup();
    }, []);

    const checkPINSetup = async () => {
        const hasSetup = await hasPINSetup();
        setHasSetupPIN(hasSetup);
    };

    const handleSetupComplete = () => {
        setHasSetupPIN(true);
    };

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
        setShowForgotPIN(false);
    };

    const handleForgotPINSuccess = () => {
        setShowForgotPIN(false);
        setIsAuthenticated(true);
    };

    // Calculate safe top padding
    const androidStatusBarHeight = RNStatusBar.currentHeight || 24;
    const safeTop = Platform.OS === 'android' ? androidStatusBarHeight : insets.top;

    // Add extra spacing as requested
    const EXTRA_SPACING = 10;
    const TOTAL_TOP_PADDING = safeTop + EXTRA_SPACING;

    // Base header height (content height)
    const HEADER_CONTENT_HEIGHT = 60;

    const headerStyle = {
        backgroundColor: '#6366f1',
        height: HEADER_CONTENT_HEIGHT + TOTAL_TOP_PADDING,
        paddingTop: TOTAL_TOP_PADDING,
    } as any;

    // Loading state
    if (hasSetupPIN === null) {
        return null; // Or a loading screen
    }

    // State 1: No PIN setup - Show setup screen
    if (!hasSetupPIN) {
        return (
            <>
                <StatusBar style="light" />
                <PINSetupScreen onComplete={handleSetupComplete} />
            </>
        );
    }

    // State 2: PIN setup but not authenticated - Show auth or forgot PIN
    if (!isAuthenticated) {
        if (showForgotPIN) {
            return (
                <>
                    <StatusBar style="light" />
                    <ForgotPINScreen
                        onSuccess={handleForgotPINSuccess}
                        onCancel={() => setShowForgotPIN(false)}
                    />
                </>
            );
        }

        return (
            <>
                <StatusBar style="light" />
                <AuthScreen
                    onAuthenticate={handleAuthSuccess}
                    onForgotPIN={() => setShowForgotPIN(true)}
                />
            </>
        );
    }

    // State 3: Authenticated - Show main app
    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: headerStyle,
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    headerTitleAlign: 'center',
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{
                        title: 'Expense Tracker',
                        headerRight: () => (
                            <TouchableOpacity
                                onPress={() => router.push('/settings')}
                                style={{ marginRight: 15 }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="settings-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                        ),
                    }}
                />
                <Stack.Screen
                    name="add-expense"
                    options={{
                        title: 'Add Expense',
                        presentation: 'modal',
                        headerStyle: {
                            ...headerStyle,
                            backgroundColor: '#ef4444',
                        },
                    }}
                />
                <Stack.Screen
                    name="add-income"
                    options={{
                        title: 'Add Income',
                        presentation: 'modal',
                        headerStyle: {
                            ...headerStyle,
                            backgroundColor: '#10b981',
                        },
                    }}
                />
                <Stack.Screen
                    name="all-transactions"
                    options={{
                        title: 'All Transactions',
                    }}
                />
                <Stack.Screen
                    name="periods"
                    options={{
                        title: 'Periods',
                        headerStyle: headerStyle,
                    }}
                />
                <Stack.Screen
                    name="settings"
                    options={{
                        title: 'Settings',
                        headerStyle: headerStyle,
                    }}
                />
            </Stack>
        </>
    );
}
