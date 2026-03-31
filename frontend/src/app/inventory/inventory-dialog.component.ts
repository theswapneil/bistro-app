import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InventoryItem } from '../models';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { map, Observable, startWith } from 'rxjs';
import { nameExistsValidator } from '../name-exists.validator';

export interface InventoryDialogData {
    isDelete?: boolean;
    item?: InventoryItem;
    list?: InventoryItem[];
}

@Component({
    selector: 'app-inventory-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatAutocompleteModule, MatInputModule, MatButtonModule],
    templateUrl: './inventory-dialog.component.html',
})
export class InventoryDialogComponent {
    form: FormGroup;
    title = this.data?.isDelete ? 'Delete Inventory Item' : (this.data?.item ? 'Add Stock' : 'Add Inventory Item');
    filteredOptions!: Observable<InventoryItem[]>;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<InventoryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: InventoryDialogData
    ) {
        this.form = this.fb.group({
            id: [data?.item?.id ?? null],
            name: [data?.item?.name ?? '', [Validators.required, nameExistsValidator(data.list)]],
            quantity: [0, [Validators.required, Validators.min(1)]],
            price: [data?.item?.price ?? 0, [Validators.required, Validators.min(1)]],
        });
        if (data?.item?.id) {
            this.form.get('name')?.clearValidators();
            this.form.get('price')?.disable();
            this.form.get('name').addValidators([Validators.required, nameExistsValidator(data.list, data?.item?.name)]);
        }
    }

    save() {
        if (this.data?.isDelete) {
            this.dialogRef.close(true);
        }
        if (this.form.valid) {
            this.dialogRef.close(this.form.getRawValue());
        }
    }

    cancel() {
        this.dialogRef.close();
    }
}
