import { Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../api.service';
import { InventoryItem, Table, OrderLine } from '../models';

@Component({
    selector: 'app-captain-dashboard',
    imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule, MatTableModule],
    templateUrl: './captain-dashboard.component.html',
    styleUrls: ['./captain-dashboard.component.scss']
})
export class CaptainDashboardComponent implements OnInit {
    tables = signal<Table[]>([]);
    // = Array.from({ length: 25 }, (_, i) => ({
    //     id: i + 1,
    //     table_number: i + 1,
    //     status: 'available'
    // }));
    selectedTable: Table | null = null;
    orderForm: FormGroup;
    error = '';
    items = signal<InventoryItem[]>([]);
    filteredItems = computed(() =>
        this.items().filter(item => item?.quantity !== null && Number(item.quantity) > 0)
    );
    tableOrders = signal<OrderLine[]>([]);
    displayedColumns: string[] = ['name', 'rate', 'quantity', 'amount', 'status'];
    statusOptions = ['pending', 'preparing', 'served', 'billed'];

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
            next: tables => this.tables.set(tables),
            error: err => this.error = err.message || 'Unable to load tables'
        });
    }

    selectTable(table: Table) {
        this.selectedTable = table;
        this.api.getTableOrders(table.id).subscribe({
            next: orders => this.tableOrders.set(orders),
            error: err => this.error = err.message || 'Unable to load orders'
        });
    }

    onStatusChange(row: any, newValue: string) {
        // Call your API service
        this.api.updateItemStatus(row.order_line_id, newValue).subscribe({
            next: (response) => {
                // Update local data to reflect change without reloading the whole table
                row.status = newValue;
                console.log('Update successful', response);
            },
            error: (err) => {
                // Revert the value or show an error message if the API fails
                console.error('Update failed', err);
            }
        });
    }

    placeOrder() {
        if (this.selectedTable && this.orderForm.valid) {
            this.error = '';
            this.api.placeOrder({ table_id: this.selectedTable.id, ...this.orderForm.value }).subscribe({
                next: () => {
                    this.orderForm.reset({ item_id: '', quantity: 1 });
                    this.loadTables();
                    this.api.getTableOrders(this.selectedTable.id).subscribe({
                        next: orders => this.tableOrders.set(orders),
                        error: err => this.error = err.message || 'Unable to load orders'
                    });
                },
                error: err => this.error = err.message || 'Failed to place order'
            });
        }
    }
}
