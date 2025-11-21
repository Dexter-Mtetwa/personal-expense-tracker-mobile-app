import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    visible: boolean;
    onHide: () => void;
    duration?: number;
}

export default function Toast({ message, type, visible, onHide, duration = 3000 }: ToastProps) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        if (visible) {
            // Slide in and fade in
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide after duration
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -20,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide();
        });
    };

    if (!visible) return null;

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return '#10b981';
            case 'error':
                return '#ef4444';
            case 'info':
                return '#6366f1';
            default:
                return '#6366f1';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'info':
                return 'ⓘ';
            default:
                return 'ⓘ';
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                    backgroundColor: getBackgroundColor(),
                },
            ]}
        >
            <Text style={styles.icon}>{getIcon()}</Text>
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 9999,
    },
    icon: {
        fontSize: 20,
        color: '#fff',
        marginRight: 12,
        fontWeight: 'bold',
    },
    message: {
        flex: 1,
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
    },
});
