import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../api.service';
import { Bill, GenerateBillRequest } from '../models';

@Component({
    selector: 'app-billing',
    imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    templateUrl: './billing.component.html',
    styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
    billForm: FormGroup;
    bill = signal<Bill | null>(null);
    error = '';
    constructor(private api: ApiService, private fb: FormBuilder) {
        this.billForm = this.fb.group({
            table_number: ['']
        });
    }
    ngOnInit() { }
    generateBill() {
        this.error = '';
        this.api.generateBill(this.billForm.value).subscribe({
            next: bill => this.bill.set(bill),
            error: err => this.error = err.message || 'Failed to generate bill'
        });
    }
}
