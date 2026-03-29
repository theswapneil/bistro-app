import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
    selector: 'app-login',
    imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    loginForm: FormGroup;
    error: string = '';

    constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.error = '';
            this.api.login(this.loginForm.value).subscribe({
                next: res => {
                    if (res.role === 'admin') {
                        this.router.navigate(['/admin/inventory']);
                    } else {
                        this.router.navigate(['/captain/dashboard']);
                    }
                },
                error: err => {
                    this.error = err.message || 'Login failed';
                }
            });
        }
    }
}
