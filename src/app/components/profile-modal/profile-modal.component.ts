import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.scss']
})
export class ProfileModalComponent implements OnInit {
  profileForm!: FormGroup;
  isEditing = false;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public dialogRef: MatDialogRef<ProfileModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User }
  ) {}
  
  ngOnInit(): void {
    this.initForm();
  }
  
  initForm(): void {
    this.profileForm = this.fb.group({
      username: [{ value: this.data.user.username, disabled: !this.isEditing }, [Validators.required]],
      email: [{ value: this.data.user.email, disabled: !this.isEditing }, [Validators.required, Validators.email]]
    });
  }
  
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    
    if (this.isEditing) {
      this.profileForm.get('username')?.enable();
      this.profileForm.get('email')?.enable();
    } else {
      this.profileForm.get('username')?.disable();
      this.profileForm.get('email')?.disable();
    }
  }
  
  onSubmit(): void {
    if (this.profileForm.valid) {
      const updatedUser = {
        ...this.data.user,
        username: this.profileForm.get('username')?.value,
        email: this.profileForm.get('email')?.value
      };
      
      this.authService.updateUserProfile(updatedUser).subscribe({
        next: (user) => {
          this.dialogRef.close(user);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
        }
      });
    }
  }
  
  onCancel(): void {
    if (this.isEditing) {
      this.toggleEdit();
      this.initForm();
    } else {
      this.dialogRef.close();
    }
  }
}