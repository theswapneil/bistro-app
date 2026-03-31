import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../api.service';
import { InventoryItem, Table } from '../models';

@Component({
    selector: 'app-captain-dashboard',
    imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    templateUrl: './captain-dashboard.component.html',
    styleUrls: ['./captain-dashboard.component.scss']
})
export class CaptainDashboardComponent implements OnInit {
    tables: Table[] = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        table_number: i + 1,
        status: 'available'
    }));
    selectedTable: Table | null = null;
    orderForm: FormGroup;
    error = '';
    items = signal<InventoryItem[]>([]);

    constructor(private api: ApiService, private fb: FormBuilder) {
        this.orderForm = this.fb.group({
            item_id: [''],
            quantity: [1]
        });
    }

    ngOnInit() {
        this.loadTables();
        this.loadItems();
    }

    loadItems() {
        this.api.getInventory().subscribe({
            next: items => this.items.set(items),
            error: err => this.error = err.message || 'Unable to load inventory'
        });
    }

    loadTables() {
        this.error = '';
        this.api.getTables().subscribe({
            next: tables => this.tables = tables,
            error: err => this.error = err.message || 'Unable to load tables'
        });
    }

    selectTable(table: Table) {
        this.selectedTable = table;
    }

    placeOrder() {
        if (this.selectedTable && this.orderForm.valid) {
            this.error = '';
            this.api.placeOrder({ table_id: this.selectedTable.id, ...this.orderForm.value }).subscribe({
                next: () => {
                    this.orderForm.reset({ item_id: '', quantity: 1 });
                    this.loadTables();
                },
                error: err => this.error = err.message || 'Failed to place order'
            });
        }
    }
}
