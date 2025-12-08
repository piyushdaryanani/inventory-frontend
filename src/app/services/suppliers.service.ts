import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Supplier {
  supplierId: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private baseUrl = 'http://localhost:3000/suppliers';

  constructor(private http: HttpClient) {}

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      (source) =>
        new Observable<Supplier[]>(observer => {
          source.subscribe({
            next: rows => {
              const mapped = rows.map((row: any): Supplier => ({
                supplierId: row.supplier_id,
                name: row.name,
                email: row.email,
                phone: row.phone,
                address: row.address
              }));
              observer.next(mapped);
              observer.complete();
            },
            error: err => observer.error(err)
          });
        })
    );
  }

  addSupplier(supplier: Omit<Supplier, 'supplierId'>): Observable<any> {
    return this.http.post<any>(this.baseUrl, supplier);
  }

  updateSupplier(id: number, supplier: Omit<Supplier, 'supplierId'>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, supplier);
  }

  deleteSupplier(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
