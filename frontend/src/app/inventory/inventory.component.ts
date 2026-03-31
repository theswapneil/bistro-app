import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { InventoryDialogComponent } from './inventory-dialog.component';
import { ApiService } from '../api.service';
import { InventoryItem } from '../models';

@Component({
    selector: 'app-inventory',
    imports: [CommonModule, MatCardModule, MatDialogModule, MatButtonModule, MatTableModule],
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
    items = signal<InventoryItem[]>([]);
    error = '';

    constructor(private api: ApiService, private dialog: MatDialog) { }

    ngOnInit() {
        this.load();
    }

    load() {
        this.error = '';
        this.api.getInventory().subscribe({
            next: items => this.items.set(items),
            error: err => this.error = err.message || 'Unable to load inventory'
        });
    }

    openForm(item?: InventoryItem) {
        const dialogRef = this.dialog.open(InventoryDialogComponent, {
            width: '420px',
            data: { item, list: this.items() }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) {
                return;
            }

            this.error = '';
            if (item) {
                this.api.addStock(item?.id, result).subscribe({
                    next: () => this.load(),
                    error: err => this.error = err.message || 'Failed to update item'
                });
            } else {
                this.api.createInventory(result).subscribe({
                    next: () => this.load(),
                    error: err => this.error = err.message || 'Failed to add item'
                });
            }
        });
    }

    delete(item: InventoryItem) {
        const dialogRef = this.dialog.open(InventoryDialogComponent, {
            width: '420px',
            data: { item, isDelete: true }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) {
                return;
            }
            this.error = '';
            this.api.deleteInventory(item.id).subscribe({
                next: () => this.load(),
                error: err => this.error = err.message || 'Failed to delete item'
            });
        });
    }
}
