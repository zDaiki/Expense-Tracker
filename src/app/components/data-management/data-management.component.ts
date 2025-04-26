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
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
    }
  
    h1 {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 2rem;
    }
  
    .card {
      background-color: #f9f9f9;
      border-radius: 10px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease-in-out;
    }
  
    .card:hover {
      transform: scale(1.01);
    }
  
    h2 {
      font-size: 1.4rem;
      margin-bottom: 0.75rem;
      color: #2c3e50;
    }
  
    p {
      margin-bottom: 1rem;
      line-height: 1.6;
    }
  
    .warning {
      color: #e74c3c;
      font-weight: bold;
      background-color: #fdecea;
      padding: 0.75rem;
      border-radius: 5px;
      margin-bottom: 1rem;
    }
  
    .file-input-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
  
    .file-input {
      display: none;
    }
  
    .file-label {
      background-color: #3498db;
      color: #fff;
      padding: 0.6rem 1rem;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 600;
      transition: background-color 0.3s ease;
    }
  
    .file-label:hover {
      background-color: #2980b9;
    }
  
    .file-name {
      font-style: italic;
      color: #666;
    }
  
    .btn-primary {
      background-color: #2ecc71;
      color: #fff;
      padding: 0.75rem 1.25rem;
      font-weight: 600;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
  
    .btn-primary:hover {
      background-color: #27ae60;
    }
  
    .btn-primary:disabled {
      background-color: #bdc3c7;
      cursor: not-allowed;
    }
  
    .actions {
      display: flex;
      justify-content: center;
      margin-top: 2rem;
    }
  
    .btn-back {
      background-color: #34495e;
      color: #fff;
      padding: 0.75rem 1.5rem;
      border-radius: 5px;
      text-decoration: none;
      font-weight: 600;
      transition: background-color 0.3s ease;
    }
  
    .btn-back:hover {
      background-color: #2c3e50;
    }
  
    @media (max-width: 600px) {
      .file-input-container {
        flex-direction: column;
        align-items: flex-start;
      }
  
      .file-label,
      .file-name {
        width: 100%;
      }
  
      .file-name {
        margin-top: 0.5rem;
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