import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';
import Chart from 'chart.js/auto';
import { ModalService } from '../../services/modal.service';

interface CategorySummary {
  name: string;
  amount: number;
  percentage: number;
  count: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  allExpenses: Expense[] = [];
  recentExpenses: Expense[] = [];
  categories: string[] = [];
  totalAmount: number = 0;
  monthlyTrend: number = 0;
  currentMonthExpenses: Expense[] = [];
  topCategory: CategorySummary | null = null;
  largestExpense: Expense | null = null;
  recentActivityCount: number = 0;
  recentActivityAmount: number = 0;
  categorySummary: CategorySummary[] = [];
  monthlyData: { month: string; amount: number }[] = [];

  constructor(
    private expenseService: ExpenseService,
    private modalService: ModalService
  ) {}
  
  //method to open modal
  addNewExpense(): void {
    this.modalService.openAddExpenseModal().subscribe(result => {
      if (result && result.action === 'add' && result.expense) {
        this.expenseService.addExpense(result.expense);
        this.loadData();
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }
  
  private monthlyChart: Chart | null = null;
  private categoryChart: Chart | null = null;
  private trendChart: Chart | null = null;
  
  
  loadData(): void {
    this.expenseService.getExpenses().subscribe(expenses => {
      this.allExpenses = expenses;
      this.categories = this.expenseService.getExpenseCategories();
      
      this.totalAmount = this.calculateTotalAmount(this.allExpenses);
      
      this.recentExpenses = this.getRecentExpenses(5);
      
      this.currentMonthExpenses = this.getCurrentMonthExpenses();

      this.monthlyTrend = this.calculateMonthlyTrend();

      this.categorySummary = this.getCategorySummary();

      this.topCategory = this.getTopCategory();

      this.largestExpense = this.getLargestExpense();
      
      const recentActivity = this.getRecentActivity(7);
      this.recentActivityCount = recentActivity.count;
      this.recentActivityAmount = recentActivity.amount;
    
      this.monthlyData = this.getMonthlyData();
      
      setTimeout(() => {
        this.renderCharts();
      }, 100);
    });
  }
  
  renderCharts(): void {
    this.renderMonthlyChart();
    this.renderCategoryChart();
    this.renderTrendChart();
  }
  
  
  // Add this method to get the daily expense trend data
  getDailyExpenseTrend(): { dates: string[], amounts: number[] } {
    // Sort expenses by date
    const sortedExpenses = [...this.allExpenses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Get the date range (last 30 days or all days if less than 30)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Filter expenses within the date range
    const recentExpenses = sortedExpenses.filter(expense => 
      new Date(expense.date) >= thirtyDaysAgo
    );
    
    // If no recent expenses, return empty arrays
    if (recentExpenses.length === 0) {
      return { dates: [], amounts: [] };
    }
    
    // Group expenses by date
    const expensesByDate: { [date: string]: number } = {};
    
    // Initialize all dates in the range with zero
    const dateRange: Date[] = [];
    const currentDate = new Date(thirtyDaysAgo);
    
    while (currentDate <= now) {
      const dateStr = this.formatDateForTrend(currentDate);
      expensesByDate[dateStr] = 0;
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Fill in actual expense amounts
    recentExpenses.forEach(expense => {
      const dateStr = this.formatDateForTrend(new Date(expense.date));
      if (expensesByDate[dateStr] !== undefined) {
        expensesByDate[dateStr] += expense.amount;
      }
    });
    
    // Convert to arrays for the chart
    const dates = Object.keys(expensesByDate);
    const amounts = Object.values(expensesByDate);
    
    return { dates, amounts };
  }
  
  // Helper method to format dates consistently for the trend chart
  formatDateForTrend(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }
  
  renderMonthlyChart(): void {
    const monthlyChartElement = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (!monthlyChartElement) return;
    
    const ctx = monthlyChartElement.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }
    
    // Create new chart and store the instance
    this.monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.monthlyData.map(data => data.month),
        datasets: [{
          label: 'Monthly Expenses',
          data: this.monthlyData.map(data => data.amount),
          backgroundColor: 'rgba(52, 152, 219, 0.7)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'Rs. ' + value;
              }
            }
          }
        }
      }
    });
  }

  renderCategoryChart(): void {
    const categoryChartElement = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!categoryChartElement) return;
    
    const ctx = categoryChartElement.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }
    
    const colors = [
      'rgba(52, 152, 219, 0.7)',  // Blue
      'rgba(46, 204, 113, 0.7)',  // Green
      'rgba(155, 89, 182, 0.7)',  // Purple
      'rgba(241, 196, 15, 0.7)',  // Yellow
      'rgba(230, 126, 34, 0.7)',  // Orange
      'rgba(231, 76, 60, 0.7)',   // Red
      'rgba(26, 188, 156, 0.7)',  // Turquoise
      'rgba(52, 73, 94, 0.7)',    // Dark Blue
      'rgba(149, 165, 166, 0.7)', // Gray
      'rgba(211, 84, 0, 0.7)'     // Dark Orange
    ];
    
    // Create new chart and store the instance
    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.categorySummary.map(category => category.name),
        datasets: [{
          data: this.categorySummary.map(category => category.amount),
          backgroundColor: colors.slice(0, this.categorySummary.length),
          borderColor: colors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',  // This helps with the pie chart overflow issue
        radius: '90%',  // This also helps with the overflow issue
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,  // Make legend items smaller
              padding: 15    // Add some padding
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw as number;
                const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => (a as number) + (b as number), 0) as number;
                const percentage = Math.round((value / total) * 100);
                return `${label}: Rs. ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  renderTrendChart(): void {
    const trendChartElement = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!trendChartElement) return;
    
    const ctx = trendChartElement.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (this.trendChart) {
      this.trendChart.destroy();
    }
    
    // Get daily expense data for the trend
    const trendData = this.getDailyExpenseTrend();
    
    // Create new chart and store the instance
    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.dates,
        datasets: [{
          label: 'Daily Expenses',
          data: trendData.amounts,
          borderColor: 'rgba(52, 152, 219, 1)',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: 'rgba(52, 152, 219, 1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'Rs. ' + value;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Rs. ' + context.raw;
              }
            }
          }
        }
      }
    });
  }
  

  calculateTotalAmount(expenses: Expense[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  getRecentExpenses(count: number): Expense[] {
    return [...this.allExpenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);
  }

  getCurrentMonthExpenses(): Expense[] {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
  }

  calculateMonthlyTrend(): number {
    const currentMonthTotal = this.calculateTotalAmount(this.currentMonthExpenses);
    
    // Get previous month expenses
    const now = new Date();
    const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const previousMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    const previousMonthExpenses = this.allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === previousMonth && expenseDate.getFullYear() === previousMonthYear;
    });
    
    const previousMonthTotal = this.calculateTotalAmount(previousMonthExpenses);
    
    // Calculate percentage change
    if (previousMonthTotal === 0) return 0;
    return ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
  }

  getCategorySummary(): CategorySummary[] {
    const summary: { [category: string]: CategorySummary } = {};
    
    // Initialize summary for all categories
    this.categories.forEach(category => {
      summary[category] = {
        name: category,
        amount: 0,
        percentage: 0,
        count: 0
      };
    });
    
    // Calculate amount and count for each category
    this.allExpenses.forEach(expense => {
      if (summary[expense.category]) {
        summary[expense.category].amount += expense.amount;
        summary[expense.category].count++;
      }
    });
    
    // Calculate percentage for each category
    Object.values(summary).forEach(category => {
      category.percentage = (category.amount / this.totalAmount) * 100 || 0;
    });
    
    return Object.values(summary).sort((a, b) => b.amount - a.amount);
  }

  getTopCategory(): CategorySummary | null {
    return this.categorySummary.length > 0 ? this.categorySummary[0] : null;
  }

  getLargestExpense(): Expense | null {
    if (this.allExpenses.length === 0) return null;
    
    return this.allExpenses.reduce((max, expense) => 
      expense.amount > max.amount ? expense : max, this.allExpenses[0]);
  }

  getRecentActivity(days: number): { count: number; amount: number } {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - days);
    
    const recentExpenses = this.allExpenses.filter(expense => 
      new Date(expense.date) >= pastDate && new Date(expense.date) <= now);
    
    return {
      count: recentExpenses.length,
      amount: this.calculateTotalAmount(recentExpenses)
    };
  }

  getMonthlyData(): { month: string; amount: number }[] {
    const monthlyData: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Initialize last 6 months with zero amounts
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      const key = `${year}-${monthIndex}`;
      monthlyData[key] = 0;
    }
    
    // Calculate amounts for each month
    this.allExpenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const month = expenseDate.getMonth();
      const year = expenseDate.getFullYear();
      const key = `${year}-${month}`;
      
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += expense.amount;
      }
    });
    
    // Convert to array format for chart
    return Object.entries(monthlyData).map(([key, amount]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month: `${months[month]} ${year}`,
        amount
      };
    });
  }

  // getCategoryIcon(category: string): string {
  //   const icons: { [key: string]: string } = {
  //     'Food': 'restaurant',
  //     'Transportation': 'directions_car',
  //     'Housing': 'home',
  //     'Entertainment': 'movie',
  //     'Shopping': 'shopping_cart',
  //     'Utilities': 'power',
  //     'Healthcare': 'local_hospital',
  //     'Education': 'school',
  //     'Travel': 'flight',
  //     'Personal': 'person'
  //   };
    
    //return icons[category] || 'category';
 // }
}