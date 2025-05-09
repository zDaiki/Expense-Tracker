import { Component, OnInit } from '@angular/core';
import { ExpenseService } from '../../services/expense.service';
import { ModalService } from '../../services/modal.service';
import { Expense } from '../../models/expense.model';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, DatePipe]
})
export class ExpenseListComponent implements OnInit {
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  paginatedExpenses: Expense[] = [];
  searchTerm: string = '';
  selectedCategory: string = '';
  categories: string[] = [];

  Math = Math;
  
  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  constructor(
    private expenseService: ExpenseService,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {
    this.categories = this.expenseService.getAllCategories();
    this.expenseService.getExpenses().subscribe(expenses => {
      this.expenses = expenses;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    this.filteredExpenses = this.expenses.filter(expense => {
      const matchesSearch = this.searchTerm === '' || 
        expense.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = this.selectedCategory === '' || 
        expense.category === this.selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    this.totalPages = Math.ceil(this.filteredExpenses.length / this.pageSize);
    this.currentPage = this.totalPages > 0 ? Math.min(this.currentPage, this.totalPages) : 1;
    this.updatePaginatedExpenses();
  }
  
  updatePaginatedExpenses(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredExpenses.length);
    this.paginatedExpenses = this.filteredExpenses.slice(startIndex, endIndex);
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.currentPage = 1; 
    this.applyFilters();
  }

  onCategoryChange(event: Event): void {
    this.selectedCategory = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.applyFilters();
  }

  addNewExpense(): void {
    this.modalService.openAddExpenseModal().subscribe(result => {
      if (result && result.action === 'add' && result.expense) {
        this.expenseService.addExpense(result.expense);
      }
    });
  }

  viewExpense(expense: Expense): void {
    this.modalService.openViewExpenseModal(expense).subscribe();
  }

  editExpense(expense: Expense): void {
    this.modalService.openEditExpenseModal(expense).subscribe(result => {
      if (result && result.action === 'edit' && result.expense) {
        this.expenseService.updateExpense(result.expense);
      }
    });
  }

  deleteExpense(expense: Expense): void {
    this.modalService.openDeleteExpenseModal(expense).subscribe(result => {
      if (result && result.action === 'delete' && result.id) {
        this.expenseService.deleteExpense(result.id);
      }
    });
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedExpenses();
    }
  }
  
  get pages(): number[] {
    const pagesArray: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than or equal to max visible pages
      for (let i = 1; i <= this.totalPages; i++) {
        pagesArray.push(i);
      }
    } else {
      // Always show first page
      pagesArray.push(1);
      
      let startPage = Math.max(2, this.currentPage - 1);
      let endPage = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      // Adjust if we're near the start
      if (this.currentPage <= 3) {
        endPage = Math.min(this.totalPages - 1, 4);
      }
      
      // Adjust if we're near the end
      if (this.currentPage >= this.totalPages - 2) {
        startPage = Math.max(2, this.totalPages - 3);
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pagesArray.push(-1); // -1 represents ellipsis
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pagesArray.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < this.totalPages - 1) {
        pagesArray.push(-1); // -1 represents ellipsis
      }
      
      // Always show last page
      pagesArray.push(this.totalPages);
    }
    
    return pagesArray;
  }
}


