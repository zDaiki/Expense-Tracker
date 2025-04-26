import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive]
})
export class AppComponent implements OnInit {
  title = 'Expense Tracker';
  isAuthenticated = false;
  currentUser: User | null = null;
  isMenuOpen = false;
  router: any;
  
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });
  }
  
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    // Close menu automatically when screen size increases
    if (window.innerWidth > 768 && this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }
  
  // Close menu when clicking on a link (for mobile)
  closeMenu(): void {
    if (window.innerWidth <= 768) {
      this.isMenuOpen = false;
    }
  }
  
  logout(): void {
    this.authService.logout();
    this.currentUser = null;
    this.isAuthenticated = false;
    this.router.navigate(['/login']);
  }
  
}
