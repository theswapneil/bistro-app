import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

interface InventoryItem {
    id: number;
    item_name: string;
    quantity: number;
    price: number;
}

@Component({
    selector: 'app-inventory',
    imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule],
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
    items: InventoryItem[] = [];
    form: FormGroup;
    editing: InventoryItem | null = null;

    constructor(private http: HttpClient, private fb: FormBuilder) {
        this.form = this.fb.group({
            item_name: [''],
            quantity: [0],
            price: [0]
        });
    }

    ngOnInit() {
        this.load();
    }

    load() {
        this.http.get<InventoryItem[]>('http://localhost:3001/api/inventory', {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        }).subscribe(items => this.items = items);
    }

    save() {
        if (this.editing) {
            this.http.put('http://localhost:3001/api/inventory/' + this.editing.id, this.form.value, {
                headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
            }).subscribe(() => { this.editing = null; this.form.reset(); this.load(); });
        } else {
            this.http.post('http://localhost:3001/api/inventory', this.form.value, {
                headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
            }).subscribe(() => { this.form.reset(); this.load(); });
        }
    }

    edit(item: InventoryItem) {
        this.editing = item;
        this.form.patchValue(item);
    }

    delete(item: InventoryItem) {
        this.http.delete('http://localhost:3001/api/inventory/' + item.id, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        }).subscribe(() => this.load());
    }

    cancel() {
        this.editing = null;
        this.form.reset();
    }
}
