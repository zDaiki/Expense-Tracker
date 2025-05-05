import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ExpenseService } from './expense.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_STORAGE_KEY = 'users';
  private readonly AUTH_STORAGE_KEY = 'auth';
  private users: User[] = [];
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isBrowser: boolean;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private expenseService: ExpenseService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadUsers();
    this.loadCurrentUser();
  }
  
  private loadUsers(): void {
    if (this.isBrowser) {
      const storedUsers = localStorage.getItem(this.USERS_STORAGE_KEY);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      }
    }
  }
  
  private saveUsers(): void {
    if (this.isBrowser) {
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(this.users));
    }
  }
  
  private loadCurrentUser(): void {
    if (this.isBrowser) {
      const authData = localStorage.getItem(this.AUTH_STORAGE_KEY);
      if (authData) {
        const { user } = JSON.parse(authData);
        this.currentUserSubject.next(user);
      }
    }
  }
  
  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }
  
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
  
  register(email: string, username: string, password: string): Observable<any> {
    // Check if user already exists
    const existingUser = this.users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return throwError(() => new Error('User with this email or username already exists'));
    }
    
    // Create new user
    const newUser: User = {
      id: this.generateId(),
      email,
      username,
      password
    };
    
    this.users.push(newUser);
    this.saveUsers();
    
    // Create auth response (without password)
    const { password: _, ...userWithoutPassword } = newUser;
    const authResponse = {
      user: userWithoutPassword,
      token: this.generateToken()
    };
    
    // Save auth data and update current user
    if (this.isBrowser) {
      localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(authResponse));
    }
    this.currentUserSubject.next(userWithoutPassword);
    
    // Initialize empty expenses for the new user
    this.expenseService.initializeEmptyExpenses(newUser.id);
    
    return of(authResponse);
  }
  
  login(emailOrUsername: string, password: string): Observable<any> {
    // Find user
    const user = this.users.find(u => 
      (u.email === emailOrUsername || u.username === emailOrUsername) && 
      u.password === password
    );
    
    if (!user) {
      return throwError(() => new Error('Invalid credentials'));
    }
    
    // Create auth response (without password)
    const { password: _, ...userWithoutPassword } = user;
    const authResponse = {
      user: userWithoutPassword,
      token: this.generateToken()
    };
    
    // Save auth data and update current user
    if (this.isBrowser) {
      localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(authResponse));
    }
    this.currentUserSubject.next(userWithoutPassword);
    
    // Set the current user ID in the expense service
    this.expenseService.setCurrentUserId(user.id);
    
    return of(authResponse);
  }
  
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.AUTH_STORAGE_KEY);
    }
    this.currentUserSubject.next(null);
    
    // Clear the current user ID in the expense service
    this.expenseService.setCurrentUserId(null);
    
    this.router.navigate(['/login']);
  }
  
  private generateId(): number {
    return this.users.length > 0 
      ? Math.max(...this.users.map(u => u.id)) + 1 
      : 1;
  }
  
  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  updateUserProfile(user: User): Observable<User> {
    // Find and update the user in the users array
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      // Preserve the password from the existing user
      const password = this.users[index].password;
      this.users[index] = { ...user, password };
      this.saveUsers();
    }
    
    // Update the current user in localStorage and in the BehaviorSubject
    const authData = {
      user: user,
      token: this.generateToken()
    };
    
    if (this.isBrowser) {
      localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(authData));
    }
    
    this.currentUserSubject.next(user);
    return of(user);
  }
}