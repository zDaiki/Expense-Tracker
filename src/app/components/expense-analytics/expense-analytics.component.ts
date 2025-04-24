import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-expense-analytics',
  templateUrl: './expense-analytics.component.html',
  styleUrls: ['./expense-analytics.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class ExpenseAnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  expenses: Expense[] = [];
  pieChart: Chart | null = null;
  barChart: Chart | null = null;
  lineChart: Chart | null = null;
  
  constructor(private expenseService: ExpenseService) {}
  
  ngOnInit(): void {
    this.expenseService.getExpenses().subscribe(expenses => {
      this.expenses = expenses;
    });
  }
  
  ngAfterViewInit(): void {
    // Wait for data to be loaded
    setTimeout(() => {
      this.createCharts();
    }, 500);
  }
  
  private createCharts(): void {
    this.createPieChart();
    this.createBarChart();
    this.createLineChart();
  }
  
  private createPieChart(): void {
    const expensesByCategory = this.getExpensesByCategory();
    const categories = Object.keys(expensesByCategory);
    const amounts = Object.values(expensesByCategory);
    
    this.pieChart = new Chart(this.pieChartCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [{
          data: amounts,
          backgroundColor: this.generateColors(categories.length)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Expenses by Category'
          }
        }
      }
    });
  }
  
  private createBarChart(): void {
    const monthlyExpenses = this.getMonthlyExpenses();
    const months = Object.keys(monthlyExpenses);
    const amounts = Object.values(monthlyExpenses);
    
    this.barChart = new Chart(this.barChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Monthly Expenses',
          data: amounts,
          backgroundColor: 'rgba(52, 152, 219, 0.6)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true
          },
          title: {
            display: true,
            text: 'Monthly Expenses'
          }
        }
      }
    });
  }
  
  private createLineChart(): void {
    const { dates, cumulativeAmounts } = this.getCumulativeExpenses();
    
    this.lineChart = new Chart(this.lineChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Expense Trend',
          data: cumulativeAmounts,
          fill: false,
          borderColor: 'rgba(52, 152, 219, 1)',
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Expense Trend Over Time'
          }
        }
      }
    });
  }
  
  private getExpensesByCategory(): Record<string, number> {
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
  
  private getMonthlyExpenses(): Record<string, number> {
    const result: Record<string, number> = {};
    
    this.expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthYear = `Rs.{date.getMonth() + 1}/Rs.{date.getFullYear()}`;
      
      if (result[monthYear]) {
        result[monthYear] += expense.amount;
      } else {
        result[monthYear] = expense.amount;
      }
    });
    
    // Sort months chronologically
    return Object.fromEntries(
      Object.entries(result).sort((a, b) => {
        const [monthA, yearA] = a[0].split('/').map(Number);
        const [monthB, yearB] = b[0].split('/').map(Number);
        
        if (yearA !== yearB) {
          return yearA - yearB;
        }
        return monthA - monthB;
      })
    );
  }
  
  private getCumulativeExpenses(): { dates: string[], cumulativeAmounts: number[] } {
    // Sort expenses by date
    const sortedExpenses = [...this.expenses].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Get unique dates
    const uniqueDates = Array.from(new Set(
      sortedExpenses.map(expense => {
        const date = new Date(expense.date);
        return `Rs.{date.getDate()}/Rs.{date.getMonth() + 1}/Rs.{date.getFullYear()}`;
      })
    ));
    
    // Calculate cumulative expenses
    let cumulativeAmount = 0;
    const cumulativeAmounts: number[] = [];
    
    uniqueDates.forEach(dateStr => {
      const expensesOnDate = sortedExpenses.filter(expense => {
        const date = new Date(expense.date);
        return `Rs.{date.getDate()}/Rs.{date.getMonth() + 1}/Rs.{date.getFullYear()}` === dateStr;
      });
      
      const totalOnDate = expensesOnDate.reduce((sum, expense) => sum + expense.amount, 0);
      cumulativeAmount += totalOnDate;
      cumulativeAmounts.push(cumulativeAmount);
    });
    
    return { dates: uniqueDates, cumulativeAmounts };
  }
  
  private generateColors(count: number): string[] {
    const colors: string[] = [];
    const baseColors = [
      'rgba(52, 152, 219, 0.7)',  // Blue
      'rgba(46, 204, 113, 0.7)',  // Green
      'rgba(155, 89, 182, 0.7)',  // Purple
      'rgba(231, 76, 60, 0.7)',   // Red
      'rgba(241, 196, 15, 0.7)',  // Yellow
      'rgba(230, 126, 34, 0.7)',  // Orange
      'rgba(26, 188, 156, 0.7)',  // Turquoise
      'rgba(149, 165, 166, 0.7)'  // Gray
    ];
    
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  }
}