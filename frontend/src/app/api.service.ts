import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, throwError, tap } from 'rxjs';
import { ApiLoginResponse, InventoryItem, LoginCredentials, Table, Bill, Stats, PlaceOrderRequest, GenerateBillRequest } from './models';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly baseUrl = 'http://localhost:3001/api';

    constructor(private http: HttpClient, private router: Router) { }

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        });
        return { headers };
    }

    private handleError(error: HttpErrorResponse) {
        const message = error.error?.message ?? error.error ?? error.statusText ?? 'Server error';
        if (error.status === 401 || message === 'Invalid token') {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            this.router.navigate(['/']);
        }
        return throwError(() => new Error(typeof message === 'string' ? message : 'Unknown API error'));
    }

    login(credentials: LoginCredentials) {
        return this.http.post<ApiLoginResponse>(`${this.baseUrl}/login`, credentials).pipe(
            tap(res => {
                localStorage.setItem('token', res.token);
                localStorage.setItem('role', res.role);
            }),
            catchError(err => this.handleError(err))
        );
    }

    getInventory() {
        return this.http.get<InventoryItem[]>(`${this.baseUrl}/inventory`, this.getAuthHeaders()).pipe(
            catchError(err => this.handleError(err))
        );
    }

    createInventory(item: Omit<InventoryItem, 'id'>) {
        return this.http.post<InventoryItem>(`${this.baseUrl}/inventory`, item, this.getAuthHeaders()).pipe(
            catchError(err => this.handleError(err))
        );
    }

    updateInventory(id: number, item: Omit<InventoryItem, 'id'>) {
        return this.http.put<InventoryItem>(`${this.baseUrl}/inventory/${id}`, item, this.getAuthHeaders()).pipe(
            catchError(err => this.handleError(err))
        );
    }

    deleteInventory(id: number) {
        return this.http.delete<void>(`${this.baseUrl}/inventory/${id}`, this.getAuthHeaders()).pipe(
            catchError(err => this.handleError(err))
        );
    }

    getTables() {
        return this.http.get<Table[]>(`${this.baseUrl}/table-dashboard`, this.getAuthHeaders()).pipe(
            catchError(err => this.handleError(err))
        );
    }

    placeOrder(order: PlaceOrderRequest) {
        return this.http.post(`${this.baseUrl}/order`, order, this.getAuthHeaders()).pipe(
            catchError(err => this.handleError(err))
        );
    }

    generateBill(request: GenerateBillRequest) {
        return this.http.post<Bill>(`${this.baseUrl}/bill`, request, this.getAuthHeaders()).pipe(
            catchError(err => this.handleError(err))
        );
    }

    getStats() {
        return this.http.get<Stats>(`${this.baseUrl}/statistics`, this.getAuthHeaders()).pipe(
            catchError(err => this.handleError(err))
        );
    }
}
