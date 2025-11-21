import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StatusBar as RNStatusBar } from 'react-native';

export default function RootLayout() {
    const headerPaddingTop = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 20; // iOS default safe area

    return (
        <>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#6366f1',
                        paddingTop: headerPaddingTop,
                        height: headerPaddingTop + 60, // base height + top padding
                    } as any,
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
                    }}
                />
                <Stack.Screen
                    name="add-expense"
                    options={{
                        title: 'Add Expense',
                        presentation: 'modal',
                        headerStyle: {
                            backgroundColor: '#ef4444',
                            paddingTop: headerPaddingTop,
                            height: headerPaddingTop + 60,
                        } as any,
                    }}
                />
                <Stack.Screen
                    name="add-income"
                    options={{
                        title: 'Add Income',
                        presentation: 'modal',
                        headerStyle: {
                            backgroundColor: '#10b981',
                            paddingTop: headerPaddingTop,
                            height: headerPaddingTop + 60,
                        } as any,
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
                        headerStyle: {
                            backgroundColor: '#6366f1',
                            paddingTop: headerPaddingTop,
                            height: headerPaddingTop + 60,
                        } as any,
                    }}
                />
            </Stack>
        </>
    );
}
