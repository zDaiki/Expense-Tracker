import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-management.component.html',
  styleUrls: ['./data-management.component.scss'],
  
})
export class DataManagementComponent {
  selectedFile: File | null = null;
  fileName: string = '';
  
  constructor(private expenseService: ExpenseService) {}
  
  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.fileName = this.selectedFile.name;
    } else {
      this.selectedFile = null;
      this.fileName = '';
    }
  }
  
  exportData(): void {
    this.expenseService.getExpenses().subscribe(expenses => {
      // Create a JSON blob from the expenses data
      const data = JSON.stringify(expenses, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      a.href = url;
      a.download = `expense-tracker-data-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }
  
  importData(): void {
    if (!this.selectedFile) {
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const jsonData = e.target?.result as string;
        const expenses = JSON.parse(jsonData) as Expense[];
        
        // Validate the imported data
        if (!Array.isArray(expenses)) {
          alert('Invalid data format. Please select a valid expense data file.');
          return;
        }
        
        // Check if each item has the required properties
        const isValid = expenses.every(expense => 
          typeof expense.id === 'number' &&
          typeof expense.description === 'string' &&
          typeof expense.amount === 'number' &&
          typeof expense.date === 'string' &&
          typeof expense.category === 'string'
        );
        
        if (!isValid) {
          alert('Invalid data format. Some expense entries are missing required properties.');
          return;
        }
        
        // Import the data
        const result = this.expenseService.importExpenses(expenses);
        if (result) {
          alert('Data imported successfully!');
          this.selectedFile = null;
          this.fileName = '';
        } else {
          alert('An error occurred while importing data. Please try again.');
        }
      } catch (error: unknown) {
        console.error('Error parsing JSON:', error);
        alert('Invalid JSON file. Please select a valid expense data file.');
      }
    };
    
    reader.readAsText(this.selectedFile);
  }
}