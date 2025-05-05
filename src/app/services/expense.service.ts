import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Expense } from '../models/expense.model';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly STORAGE_KEY_PREFIX = 'expenses_';
  private expenses: Expense[] = [];
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  private isBrowser: boolean;
  private currentUserId: number | null = null;
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  
    if (this.isBrowser) {
      const storedUserId = localStorage.getItem('current_user_id');
      if (storedUserId) {
        this.currentUserId = parseInt(storedUserId, 10);
        this.loadExpenses();
      }
    }
  }
  
  // Set the current user ID when a user logs in
  setCurrentUserId(userId: number | null): void {
    this.currentUserId = userId;
    if (this.isBrowser) {
      if (userId !== null) {
        localStorage.setItem('current_user_id', userId.toString());
        this.loadExpenses();
      } else {
        localStorage.removeItem('current_user_id');
        this.expenses = [];
        this.expensesSubject.next([]);
      }
    }
  }
  
  
  // Get the storage key for the current user
  private getUserStorageKey(): string {
    return `${this.STORAGE_KEY_PREFIX}${this.currentUserId}`;
  }
  
  // Initialize empty expenses for a new user
  initializeEmptyExpenses(userId: number): void {
    if (this.isBrowser) {
      localStorage.setItem(`${this.STORAGE_KEY_PREFIX}${userId}`, JSON.stringify([]));
    }
  }
  
  private loadExpenses(): void {
    if (this.isBrowser && this.currentUserId) {
      const storedExpenses = localStorage.getItem(this.getUserStorageKey());
      if (storedExpenses) {
        this.expenses = JSON.parse(storedExpenses);
        this.expensesSubject.next([...this.expenses]);
      } else {
        // If no expenses found, initialize with empty array
        this.expenses = [];
        this.expensesSubject.next([]);
      }
    }
  }
  
  private saveExpenses(): void {
    if (this.isBrowser && this.currentUserId) {
      localStorage.setItem(this.getUserStorageKey(), JSON.stringify(this.expenses));
    }
    this.expensesSubject.next([...this.expenses]);
  }
  
  getExpenses(): Observable<Expense[]> {
    return this.expensesSubject.asObservable();
  }
  
  getTotalExpenses(): number {
    return this.expenses.reduce((total, expense) => total + expense.amount, 0);
  }
  
  getExpenseById(id: number): Expense | undefined {
    return this.expenses.find(e => e.id === id);
  }
  
  addExpense(expense: Omit<Expense, 'id'>): Expense {
    const newExpense: Expense = {
      ...expense,
      id: this.generateId()
    };
    
    this.expenses.push(newExpense);
    this.saveExpenses();
    
    return newExpense;
  }
  
  updateExpense(expense: Expense): Expense | undefined {
    const index = this.expenses.findIndex(e => e.id === expense.id);
    
    if (index !== -1) {
      this.expenses[index] = expense;
      this.saveExpenses();
      
      return expense;
    }
    
    return undefined;
  }
  
  deleteExpense(id: number): boolean {
    const index = this.expenses.findIndex(e => e.id === id);
    
    if (index !== -1) {
      this.expenses.splice(index, 1);
      this.saveExpenses();
      return true;
    }
    
    return false;
  }
  
  getExpensesByCategory(): Record<string, number> {
    const result: Record<string, number> = {};
    
    this.expenses.forEach(expense => {
      if (result[expense.category]) {
        result[expense.category] += expense.amount;
      } else {
        result[expense.category] = expense.amount;
      }
    });
    
    return result;
  }
  
  getExpenseCategories(): string[] {
    return [...new Set(this.expenses.map(expense => expense.category))];
  }
  
  importExpenses(expenses: Expense[]): boolean {
    this.expenses = expenses;
    this.saveExpenses();
    return true;
  }
  
  private generateId(): number {
    return this.expenses.length > 0 
      ? Math.max(...this.expenses.map(e => e.id)) + 1 
      : 1;
  }
  
  // Predefined categories
  private readonly DEFAULT_CATEGORIES = [
    'Food & Dining',
    'Shopping',
    'Housing',
    'Transportation',
    'Entertainment',
    'Healthcare',
    'Education',
    'Utilities',
    'Travel',
    'Personal Care',
    'Investments',
    'Other'
  ];
  
  // Get all available categories (both predefined and user-created)
  getAllCategories(): string[] {
    // Combine predefined categories with user-created ones
    const userCategories = this.getExpenseCategories();
    const allCategories = [...this.DEFAULT_CATEGORIES];
    
    // Add any user categories that aren't in the default list
    userCategories.forEach(category => {
      if (!allCategories.includes(category)) {
        allCategories.push(category);
      }
    });
    
    // Sort alphabetically
    return allCategories.sort();
  }
}
