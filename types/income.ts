export interface Income {
    id: string;
    amount: number;
    description: string;
    source: string;
    date: string; // ISO string format
}

export const INCOME_SOURCES = ['Salary', 'Side Hustle', 'Gig', 'Freelance', 'Other'] as const;
export type IncomeSource = typeof INCOME_SOURCES[number];
