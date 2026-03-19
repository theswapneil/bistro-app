import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';

interface Table {
    id: number;
    table_number: number;
    status: string;
}

@Component({
    selector: 'app-captain-dashboard',
    templateUrl: './captain-dashboard.component.html',
    styleUrls: ['./captain-dashboard.component.scss']
})
export class CaptainDashboardComponent implements OnInit {
    tables: Table[] = [];
    selectedTable: Table | null = null;
    orderForm: FormGroup;

    constructor(private http: HttpClient, private fb: FormBuilder) {
        this.orderForm = this.fb.group({
            item_id: [''],
            quantity: [1]
        });
    }

    ngOnInit() {
        this.loadTables();
    }

    loadTables() {
        this.http.get<Table[]>('http://localhost:3001/api/table-dashboard', {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        }).subscribe(tables => this.tables = tables);
    }

    selectTable(table: Table) {
        this.selectedTable = table;
    }

    placeOrder() {
        if (this.selectedTable && this.orderForm.valid) {
            this.http.post('http://localhost:3001/api/order', {
                table_id: this.selectedTable.id,
                ...this.orderForm.value
            }, {
                headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
            }).subscribe(() => {
                this.orderForm.reset({ item_id: '', quantity: 1 });
                this.loadTables();
            });
        }
    }
}
