import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  totalAmount: number = 0;
  recentExpenses: Expense[] = [];
  categories: string[] = [];
  categoryBreakdown: Record<string, number> = {};
  monthlyExpenses: Record<string, number> = {};
  
  constructor(private expenseService: ExpenseService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Subscribe to expenses
    this.expenseService.getExpenses().subscribe(expenses => {
      // Calculate total amount
      this.totalAmount = this.expenseService.getTotalExpenses();
      
      // Get recent expenses (last 5)
      this.recentExpenses = [...expenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      // Get categories
      this.categories = this.expenseService.getExpenseCategories();
      
      // Get category breakdown
      this.categoryBreakdown = this.expenseService.getExpensesByCategory();
      
      // Calculate monthly expenses
      this.calculateMonthlyExpenses(expenses);
    });
  }
  
  calculateMonthlyExpenses(expenses: Expense[]): void {
    const monthlyData: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize with zero values
    const currentMonth = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      monthlyData[months[monthIndex]] = 0;
    }
    
    // Fill with actual data
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const monthName = months[expenseDate.getMonth()];
      const currentYear = new Date().getFullYear();
      
      // Only include expenses from the last 6 months
      if (expenseDate.getFullYear() === currentYear && 
          expenseDate.getMonth() >= (currentMonth - 5 + 12) % 12 && 
          expenseDate.getMonth() <= currentMonth) {
        monthlyData[monthName] = (monthlyData[monthName] || 0) + expense.amount;
      }
    });
    
    this.monthlyExpenses = monthlyData;
  }
  
  getCategoryPercentage(amount: number): number {
    const maxAmount = Math.max(...Object.values(this.categoryBreakdown));
    return maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  }
  
  getMonthPercentage(amount: number): number {
    const maxAmount = Math.max(...Object.values(this.monthlyExpenses));
    return maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  }
}
