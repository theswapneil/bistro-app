import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

interface Stats {
    daily: number;
    monthly: number;
    expenses: number;
}

@Component({
    selector: 'app-stats',
    imports: [CommonModule, MatCardModule],
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
    stats: Stats = { daily: 0, monthly: 0, expenses: 0 };
    constructor(private http: HttpClient) { }
    ngOnInit() {
        this.http.get<Stats>('http://localhost:3001/api/statistics', {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        }).subscribe(stats => this.stats = stats);
    }
}
