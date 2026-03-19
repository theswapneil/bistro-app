import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-login',
    imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    loginForm: FormGroup;
    error: string = '';

    constructor(private fb: FormBuilder, private http: HttpClient) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.http.post<any>('http://localhost:3001/api/login', this.loginForm.value).subscribe({
                next: (res) => {
                    localStorage.setItem('token', res.token);
                    localStorage.setItem('role', res.role);
                    // Redirect based on role
                    if (res.role === 'admin') {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/captain';
                    }
                },
                error: (err) => {
                    this.error = err.error.message || 'Login failed';
                }
            });
        }
    }
}
