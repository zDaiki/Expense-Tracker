import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Expense } from '../../../models/expense.model';
import { ExpenseService } from '../../../services/expense.service';

export interface ExpenseModalData {
  mode: 'add' | 'edit' | 'view' | 'delete';
  expense?: Expense;
  categories: string[];
}

@Component({
  selector: 'app-expense-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './expense-modal.component.html',
  styleUrls: ['./expense-modal.component.scss']
})
export class ExpenseModalComponent implements OnInit {
  expenseForm!: FormGroup;
  mode: 'add' | 'edit' | 'view' | 'delete';
  title: string = '';
  submitButtonText: string = '';
  isReadOnly: boolean = false;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    public dialogRef: MatDialogRef<ExpenseModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpenseModalData
  ) {
    this.mode = data.mode;
    this.setModalProperties();
  }

  ngOnInit(): void {
    this.initForm();
  }

  setModalProperties(): void {
    switch (this.mode) {
      case 'add':
        this.title = 'Add New Expense';
        this.submitButtonText = 'Add Expense';
        this.isReadOnly = false;
        break;
      case 'edit':
        this.title = 'Edit Expense';
        this.submitButtonText = 'Update Expense';
        this.isReadOnly = false;
        break;
      case 'view':
        this.title = 'Expense Details';
        this.submitButtonText = '';
        this.isReadOnly = true;
        break;
      case 'delete':
        this.title = 'Delete Expense';
        this.submitButtonText = 'Delete';
        this.isReadOnly = true;
        break;
    }
  }

  initForm(): void {
    const expense = this.data.expense || {
      id: 0,
      description: '',
      amount: '',
      date: new Date(),
      category: ''
    };

    this.expenseForm = this.fb.group({
      description: [{ value: expense.description, disabled: this.isReadOnly }, [Validators.required]],
      amount: [{ value: expense.amount, disabled: this.isReadOnly }, [Validators.required, Validators.min(10)]],
      date: [{ value: expense.date, disabled: this.isReadOnly }, [Validators.required]],
      category: [{ value: expense.category, disabled: this.isReadOnly }, [Validators.required]],
      customCategory: ['']
    });
    this.expenseForm.get('category')?.valueChanges.subscribe(value => {
      const customCategoryControl = this.expenseForm.get('customCategory');
      if (value === 'Other') {
        customCategoryControl?.setValidators([Validators.required]);
      } else {
        customCategoryControl?.clearValidators();
      }
      customCategoryControl?.updateValueAndValidity();
    });
  }

  onSubmit(): void {

    this.expenseForm.markAllAsTouched();

    if (this.mode === 'delete') {
      this.dialogRef.close({ action: 'delete', id: this.data.expense?.id });
      return;
    }

    if (this.expenseForm.invalid) {
      return;
    }

    const formValue = this.expenseForm.getRawValue();
    const expense: Expense = {
      id: this.data.expense?.id || 0,
      description: formValue.description,
      amount: formValue.amount,
      date: formValue.date,
      category: formValue.category === 'Other' ? formValue.customCategory : formValue.category
    };

    this.dialogRef.close({ action: this.mode, expense });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}