import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ExpenseModalComponent, ExpenseModalData } from '../components/shared/expense-modal/expense-modal.component';
import { Expense } from '../models/expense.model';
import { ExpenseService } from './expense.service';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  constructor(
    private dialog: MatDialog,
    private expenseService: ExpenseService
  ) {}

  openAddExpenseModal(): Observable<any> {
    const categories = this.expenseService.getAllCategories();
    
    return this.dialog.open(ExpenseModalComponent, {
      width: '500px',
      data: {
        mode: 'add',
        categories
      } as ExpenseModalData
    }).afterClosed();
  }

  openViewExpenseModal(expense: Expense): Observable<any> {
    const categories = this.expenseService.getExpenseCategories();
    
    return this.dialog.open(ExpenseModalComponent, {
      width: '350px',
      data: {
        mode: 'view',
        expense,
        categories
      } as ExpenseModalData
    }).afterClosed();
  }

  openEditExpenseModal(expense: Expense): Observable<any> {
    const categories = this.expenseService.getAllCategories();
    
    return this.dialog.open(ExpenseModalComponent, {
      width: '500px',
      data: {
        mode: 'edit',
        expense,
        categories
      } as ExpenseModalData
    }).afterClosed();
  }

  openDeleteExpenseModal(expense: Expense): Observable<any> {
    const categories = this.expenseService.getExpenseCategories();
    
    return this.dialog.open(ExpenseModalComponent, {
      width: '400px',
      data: {
        mode: 'delete',
        expense,
        categories
      } as ExpenseModalData
    }).afterClosed();
  }
}