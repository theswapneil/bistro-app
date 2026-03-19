import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { LoginComponent } from './app/login/login.component';
import { InventoryComponent } from './app/inventory/inventory.component';
import { CaptainDashboardComponent } from './app/captain-dashboard/captain-dashboard.component';
import { BillingComponent } from './app/billing/billing.component';
import { StatsComponent } from './app/stats/stats.component';

bootstrapApplication(AppComponent, {
    providers: [
        provideRouter([
            { path: '', component: LoginComponent },
            { path: 'admin/inventory', component: InventoryComponent },
            { path: 'captain/dashboard', component: CaptainDashboardComponent },
            { path: 'billing', component: BillingComponent },
            { path: 'stats', component: StatsComponent },
            { path: '**', redirectTo: '' }
        ]),
        provideHttpClient(),
        provideAnimations()
    ]
}).catch(err => console.error(err));
