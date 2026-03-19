import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

interface Bill {
    id: number;
    table_number: number;
    items: { name: string; qty: number; price: number; }[];
    total: number;
}

@Component({
    selector: 'app-billing',
    imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    templateUrl: './billing.component.html',
    styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
    billForm: FormGroup;
    bill: Bill | null = null;
    constructor(private http: HttpClient, private fb: FormBuilder) {
        this.billForm = this.fb.group({
            table_number: ['']
        });
    }
    ngOnInit() { }
    generateBill() {
        this.http.post<Bill>('http://localhost:3001/api/bill', this.billForm.value, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        }).subscribe(bill => this.bill = bill);
    }
}
