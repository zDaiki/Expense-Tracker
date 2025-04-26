import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  totalAmount: number = 0;
  recentExpenses: Expense[] = [];
  categories: string[] = [];
  categoryBreakdown: Record<string, number> = {};
  monthlyExpenses: Record<string, number> = {};
  allExpenses: Expense[] = [];
  
  // Chart objects
  pieChart: Chart | null = null;
  barChart: Chart | null = null;
  lineChart: Chart | null = null;
  
  constructor(private expenseService: ExpenseService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  ngAfterViewInit(): void {
    // Wait for data to be loaded before creating charts
    setTimeout(() => {
      this.createCharts();
    }, 500);
  }

  loadDashboardData(): void {
    // Subscribe to expenses
    this.expenseService.getExpenses().subscribe(expenses => {
      this.allExpenses = expenses;
      
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
  
  createCharts(): void {
    this.createPieChart();
    this.createBarChart();
    this.createLineChart();
  }
  
  createPieChart(): void {
    if (!this.pieChartCanvas) return;
    
    const ctx = this.pieChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Prepare data for pie chart
    const categories = Object.keys(this.categoryBreakdown);
    const amounts = Object.values(this.categoryBreakdown);
    
    // Generate colors
    const backgroundColors = categories.map((_, index) => {
      const hue = (index * 137) % 360; // Golden angle approximation for good color distribution
      return `hsl(${hue}, 70%, 60%)`;
    });
    
    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [{
          data: amounts,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw as number;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: Rs. ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  createBarChart(): void {
    if (!this.barChartCanvas) return;
    
    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Prepare data for bar chart
    const months = Object.keys(this.monthlyExpenses);
    const amounts = Object.values(this.monthlyExpenses);
    
    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Monthly Expenses',
          data: amounts,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
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
  
  createLineChart(): void {
    if (!this.lineChartCanvas) return;
    
    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Group expenses by date
    const expensesByDate: Record<string, number> = {};
    
    // Sort expenses by date
    const sortedExpenses = [...this.allExpenses].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Get the last 30 days of expenses
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Initialize all dates in the last 30 days with zero
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - (29 - i));
      const dateString = date.toISOString().split('T')[0];
      expensesByDate[dateString] = 0;
    }
    
    // Fill with actual data
    sortedExpenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate >= thirtyDaysAgo && expenseDate <= today) {
        const dateString = expenseDate.toISOString().split('T')[0];
        expensesByDate[dateString] = (expensesByDate[dateString] || 0) + expense.amount;
      }
    });
    
    // Calculate cumulative expenses
    const dates = Object.keys(expensesByDate).sort();
    const amounts = Object.values(expensesByDate);
    
    let cumulativeAmounts = [];
    let runningTotal = 0;
    for (const amount of amounts) {
      runningTotal += amount;
      cumulativeAmounts.push(runningTotal);
    }
    
    // Format dates for display
    const formattedDates = dates.map(date => {
      const d = new Date(date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    
    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: formattedDates,
        datasets: [
          {
            label: 'Daily Expenses',
            data: amounts,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.1
          },
          {
            label: 'Cumulative Expenses',
            data: cumulativeAmounts,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: {
              display: true,
              text: 'Daily Amount'
            },
            ticks: {
              callback: function(value) {
                return 'Rs. ' + value;
              }
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: 'Cumulative Amount'
            },
            grid: {
              drawOnChartArea: false
            },
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
                return context.dataset.label + ': Rs. ' + context.raw;
              }
            }
          }
        }
      }
    });
  }
}
