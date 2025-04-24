import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ExpenseListComponent } from './components/expense-list/expense-list.component';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { ExpenseDetailComponent } from './components/expense-detail/expense-detail.component';
import { DataManagementComponent } from './components/data-management/data-management.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'expenses', component: ExpenseListComponent, canActivate: [AuthGuard] },
  { path: 'expenses/new', component: ExpenseFormComponent, canActivate: [AuthGuard] },
  { path: 'expenses/:id', component: ExpenseDetailComponent, canActivate: [AuthGuard] },
  { path: 'expenses/:id/edit', component: ExpenseFormComponent, canActivate: [AuthGuard] },
  { path: 'data-management', component: DataManagementComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' }
];
