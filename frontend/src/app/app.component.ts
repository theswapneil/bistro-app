import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule],
    template: `
      <mat-toolbar color="primary" class="app-toolbar">
        <span class="app-title">Bar & Restaurant</span>
        <span class="app-spacer"></span>

        <ng-container *ngIf="role">
          <a mat-button
             *ngFor="let link of navLinks"
             [routerLink]="link.path"
             routerLinkActive="active-link"
             [hidden]="!isRoleAllowed(link.roles)">
            {{ link.label }}
          </a>
          <button mat-button (click)="logout()">Logout</button>
        </ng-container>
      </mat-toolbar>

      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    `,
    styles: [
        `
      .app-toolbar {
        position: sticky;
        top: 0;
        z-index: 1000;
      }

      .app-title {
        font-weight: 700;
        letter-spacing: 0.05em;
      }

      .app-spacer {
        flex: 1 1 auto;
      }

      .active-link {
        text-decoration: underline;
      }

      .app-main {
        padding: 16px;
        min-height: calc(100vh - 64px);
        background: #f4f6f8;
      }

      a.mat-button {
        color: white;
      }

      button.mat-button {
        color: white;
      }
    `]
})
export class AppComponent {
    role = localStorage.getItem('role');

    navLinks = [
        { label: 'Dashboard', path: '/captain/dashboard', roles: ['captain', 'admin'] },
        { label: 'Inventory', path: '/admin/inventory', roles: ['admin'] },
        { label: 'Billing', path: '/billing', roles: ['admin', 'captain'] },
        { label: 'Stats', path: '/stats', roles: ['admin'] }
    ];

    constructor(private router: Router) {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
            this.role = localStorage.getItem('role');
        });
    }

    isRoleAllowed(roles: string[]) {
        return !!this.role && roles.includes(this.role);
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        this.role = null;
        this.router.navigate(['/']);
    }
}
