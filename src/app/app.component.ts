import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from './services/auth.service';
import { User } from './models/user.model';
import { ProfileModalComponent } from './components/profile-modal/profile-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    MatMenuModule, 
    MatIconModule, 
    MatButtonModule, 
    MatDividerModule,
    MatDialogModule
  ]
})
export class AppComponent implements OnInit {
  title = 'Expense Tracker';
  isAuthenticated = false;
  currentUser: User | null = null;
  isMenuOpen = false;
  
  constructor(
    private authService: AuthService,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });
  }
  
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  openProfileModal(): void {
    if (!this.currentUser) return;
    
    const dialogRef = this.dialog.open(ProfileModalComponent, {
      width: '500px',
      data: { user: this.currentUser }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // User profile was updated
        console.log('Profile updated:', result);
      }
    });
  }
  
  logout(): void {
    this.authService.logout();
  }
}