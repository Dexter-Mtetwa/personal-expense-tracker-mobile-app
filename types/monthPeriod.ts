export interface MonthPeriod {
    id: string;
    startDate: string; // ISO string format
    endDate: string; // ISO string format (startDate + 30 days)
    name: string; // User-friendly name like "Dec 16 - Jan 15"
    isActive: boolean; // Whether this is the currently active period
}

/**
 * Check if a date falls within a month period
 */
export const isDateInPeriod = (date: string, period: MonthPeriod): boolean => {
    const checkDate = new Date(date);
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return checkDate >= start && checkDate <= end;
};

/**
 * Create a new month period starting from a given date
 */
export const createMonthPeriod = (startDate: Date, customName?: string, isActive: boolean = false): MonthPeriod => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    // Auto-generate name if not provided
    const name = customName || formatPeriodName(startDate, endDate);

    return {
        id: startDate.getTime().toString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        name,
        isActive,
    };
};

/**
 * Format a period name from start and end dates
 */
export const formatPeriodName = (startDate: Date, endDate: Date): string => {
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
};

/**
 * Check if current date is past the period end date
 */
export const isPeriodExpired = (period: MonthPeriod): boolean => {
    const now = new Date();
    const end = new Date(period.endDate);
    return now > end;
};
