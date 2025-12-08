import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  totalSuppliers: number;
  totalCategories: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = 'http://localhost:3000/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<any>(`${this.baseUrl}/stats`).pipe(
      map((res: any) => ({
        totalProducts: Number(res.totalProducts) || 0,
        totalStock: Number(res.totalStock) || 0,
        totalSuppliers: Number(res.totalSuppliers) || 0,
        totalCategories: Number(res.totalCategories) || 0
      }))
    );
  }
}
