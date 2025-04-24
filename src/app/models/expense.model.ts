export interface Expense {
    id: number;
    description: string;
    amount: number;
    date: Date;
    category: string;
  }
  
  export enum ExpenseCategory {
    FOOD = 'Food',
    TRANSPORTATION = 'Transportation',
    ENTERTAINMENT = 'Entertainment',
    UTILITIES = 'Utilities',
    RENT = 'Rent',
    OTHERS = 'Others'
  }