import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'admin/inventory', component: InventoryComponent },
    { path: 'captain/dashboard', component: CaptainDashboardComponent },
    { path: 'billing', component: BillingComponent },
    { path: 'stats', component: StatsComponent },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
