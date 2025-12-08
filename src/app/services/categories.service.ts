import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private baseUrl = 'http://localhost:3000/categories';

  constructor(private http: HttpClient) {}

  // GET /categories
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  // POST /categories
  addCategory(payload: { name: string }): Observable<any> {
    return this.http.post<any>(this.baseUrl, {
      category_name: payload.name
    });
  }

  // PUT /categories/:id
  updateCategory(id: number, payload: { name: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, {
      category_name: payload.name
    });
  }

  // DELETE /categories/:id
  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
