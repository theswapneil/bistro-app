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
    title = this.data?.isDelete ? 'Delete Inventory Item' : (this.data?.item ? 'Edit Inventory Item' : 'Add Inventory Item');
    filteredOptions!: Observable<InventoryItem[]>;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<InventoryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: InventoryDialogData
    ) {
        this.form = this.fb.group({
            id: [data?.item?.id ?? null],
            item_name: [data?.item?.item_name ?? '', Validators.required],
            quantity: [data?.item?.quantity ?? 0, [Validators.required, Validators.min(0)]],
            price: [data?.item?.price ?? 0, [Validators.required, Validators.min(0)]],
        });
        this.filteredOptions = this.form.get('item_name')!.valueChanges.pipe(
            // startWith(''),
            map(value => {
                const filterValue = this._filter(value || '');
                console.log('filteredOptions function', value, this.data?.list, filterValue)

                return filterValue
            })
        );
    }

    private _filter(value: string | InventoryItem): InventoryItem[] {
        console.log('filter function', value);
        const filterValue = typeof value === 'string' ? value?.toLowerCase() : value?.item_name;
        return this.data?.list?.filter(option =>
            option.item_name.toLowerCase().includes(filterValue)
        );
    }

    onOptionSelected(event: MatAutocompleteSelectedEvent) {
        console.log('onOptionSelected function', event.option, event.option.value)

        const selectedItem = event.option.value as InventoryItem;
        this.form.patchValue({
            id: selectedItem.id,
            item_name: selectedItem.item_name,
            quantity: selectedItem.quantity,
            price: selectedItem.price
        });
    }

    displayFn(item: InventoryItem): string {
        console.log('Disaply function', item, item.item_name)
        return item && item.item_name ? item.item_name : '';
    }

    save() {
        if (this.data?.isDelete) {
            this.dialogRef.close(true);
        }
        if (this.form.valid) {
            this.dialogRef.close(this.form.value);
        }
    }

    cancel() {
        this.dialogRef.close();
    }
}
