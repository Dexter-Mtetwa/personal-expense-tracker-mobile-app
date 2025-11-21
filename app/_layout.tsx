import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    return (
        <>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#6366f1',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
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
                    }}
                />
                <Stack.Screen
                    name="all-expenses"
                    options={{
                        title: 'All Expenses',
                    }}
                />
            </Stack>
        </>
    );
}
