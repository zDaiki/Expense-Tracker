import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';
import {  DatePipe, NgIf, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-expense-detail',
  templateUrl: './expense-detail.component.html',
  styleUrls: ['./expense-detail.component.scss'],
  standalone: true,
  imports: [NgIf, RouterLink, DatePipe, DecimalPipe]
})
export class ExpenseDetailComponent implements OnInit {
  expense: Expense | undefined;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private expenseService: ExpenseService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.expense = this.expenseService.getExpenseById(+id);
        if (!this.expense) {
          this.router.navigate(['/expenses']);
        }
      }
    });
  }

  deleteExpense(): void {
    if (this.expense && confirm('Are you sure you want to delete this expense?')) {
      this.expenseService.deleteExpense(this.expense.id);
      this.router.navigate(['/expenses']);
    }
  }
}
