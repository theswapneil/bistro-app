export interface LoginCredentials {
    username: string;
    password: string;
}

export interface ApiLoginResponse {
    token: string;
    role: string;
}

export interface InventoryItem {
    id: number;
    item_name: string;
    quantity: number;
    price: number;
}

export interface Table {
    id: number;
    table_number: number;
    status: string;
}

export interface BillItem {
    name: string;
    qty: number;
    price: number;
}

export interface Bill {
    id: number;
    table_number: number;
    items: BillItem[];
    total: number;
}

export interface Stats {
    daily: number;
    monthly: number;
    expenses: number;
}

export interface PlaceOrderRequest {
    table_id: number;
    item_id: string | number;
    quantity: number;
}

export interface GenerateBillRequest {
    table_number: string;
}
