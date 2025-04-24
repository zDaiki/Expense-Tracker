import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, RouterLink]
})
export class ExpenseFormComponent implements OnInit {
  expenseForm!: FormGroup;
  isEditMode: boolean = false;
  expenseId: number | null = null;
  categories: string[] = [];
  
  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Get all available categories
    this.categories = this.expenseService.getAllCategories();
    
    this.expenseForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: ['', Validators.required],
      category: ['', Validators.required],
      customCategory: ['']
    });
    
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.expenseId = +id;
        this.loadExpenseData(+id);
      } else {
        // Set default date to today for new expenses
        this.expenseForm.patchValue({
          date: this.formatDate(new Date())
        });
      }
    });
    
    // Listen for changes to the category field
    this.expenseForm.get('category')?.valueChanges.subscribe(value => {
      const customCategoryControl = this.expenseForm.get('customCategory');
      if (value === 'Other') {
        customCategoryControl?.setValidators(Validators.required);
      } else {
        customCategoryControl?.clearValidators();
      }
      customCategoryControl?.updateValueAndValidity();
    });
  }

  loadExpenseData(id: number): void {
    const expense = this.expenseService.getExpenseById(id);
    if (expense) {
      this.expenseForm.patchValue({
        description: expense.description,
        amount: expense.amount,
        date: this.formatDate(expense.date),
        category: expense.category
      });
    } else {
      this.router.navigate(['/expenses']);
    }
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      return;
    }
    
    const formValue = this.expenseForm.value;
    
    // Use custom category if "Other" is selected
    let category = formValue.category;
    if (category === 'Other' && formValue.customCategory) {
      category = formValue.customCategory;
    }
    
    const expense: Omit<Expense, 'id'> = {
      description: formValue.description,
      amount: +formValue.amount,
      date: new Date(formValue.date),
      category: category
    };
    
    if (this.isEditMode && this.expenseId !== null) {
      this.expenseService.updateExpense({
        ...expense,
        id: this.expenseId
      } as Expense);
    } else {
      this.expenseService.addExpense(expense);
    }
    
    this.router.navigate(['/expenses']);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  // Format date to YYYY-MM-DD for input[type="date"]
  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
}
