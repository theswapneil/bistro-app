import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InventoryItem } from '../models';

export interface InventoryDialogData {
    item?: InventoryItem;
}

@Component({
    selector: 'app-inventory-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    templateUrl: './inventory-dialog.component.html',
})
export class InventoryDialogComponent {
    form: FormGroup;
    title = this.data?.item ? 'Edit Inventory Item' : 'Add Inventory Item';

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<InventoryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: InventoryDialogData
    ) {
        this.form = this.fb.group({
            item_name: [data?.item?.item_name ?? '', Validators.required],
            quantity: [data?.item?.quantity ?? 0, [Validators.required, Validators.min(0)]],
            price: [data?.item?.price ?? 0, [Validators.required, Validators.min(0)]],
        });
    }

    save() {
        if (this.form.valid) {
            this.dialogRef.close(this.form.value);
        }
    }

    cancel() {
        this.dialogRef.close();
    }
}
