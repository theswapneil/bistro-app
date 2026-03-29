import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../api.service';
import { Stats } from '../models';

@Component({
    selector: 'app-stats',
    imports: [CommonModule, MatCardModule],
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
    stats: Stats = { daily: 0, monthly: 0, expenses: 0 };
    error = '';
    constructor(private api: ApiService) { }
    ngOnInit() {
        this.error = '';
        this.api.getStats().subscribe({
            next: stats => this.stats = stats,
            error: err => this.error = err.message || 'Unable to load statistics'
        });
    }
}
