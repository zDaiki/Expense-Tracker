import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="data-management-container">
      <h1>Data Management</h1>
      
      <div class="card">
        <h2>Export Data</h2>
        <p>Download your expense data as a JSON file for backup or transfer to another device.</p>
        <button class="btn-primary" (click)="exportData()">Export Data</button>
      </div>
      
      <div class="card">
        <h2>Import Data</h2>
        <p>Import expense data from a previously exported JSON file.</p>
        <p class="warning">Warning: This will replace your current data. Make sure to export your current data first if you want to keep it.</p>
        
        <div class="file-input-container">
          <input 
            type="file" 
            id="fileInput" 
            accept=".json" 
            (change)="handleFileInput($event)"
            #fileInput
            class="file-input"
          >
          <label for="fileInput" class="file-label">Choose File</label>
          <span class="file-name">{{ fileName || 'No file chosen' }}</span>
        </div>
        
        <button 
          class="btn-primary" 
          [disabled]="!selectedFile" 
          (click)="importData()"
        >
          Import Data
        </button>
      </div>
      
      <div class="actions">
        <a routerLink="/dashboard" class="btn-back">Back to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .data-management-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      
      h1 {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .card {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        padding: 20px;
        margin-bottom: 20px;
        
        h2 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #333;
        }
        
        p {
          margin-bottom: 20px;
          color: #666;
        }
        
        .warning {
          color: #e74c3c;
          font-weight: 500;
        }
      }
      
      .file-input-container {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        
        .file-input {
          position: absolute;
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          z-index: -1;
        }
        
        .file-label {
          background-color: #3498db;
          color: white;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          
          &:hover {
            background-color: #2980b9;
          }
        }
        
        .file-name {
          margin-left: 15px;
          color: #666;
        }
      }
      
      .actions {
        display: flex;
        justify-content: center;
        margin-top: 30px;
        
        .btn-back {
          display: inline-block;
          padding: 12px 24px;
          background-color: #3498db;
          color: white;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 600;
          
          &:hover {
            background-color: #2980b9;
          }
        }
      }
    }
  `]
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