import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProcedureService {
  private apiUrl = 'http://localhost:3001/api/procedures';

  constructor(private http: HttpClient) {}

  getProcedures(view?: string): Observable<any[]> {
    let params = new HttpParams();
    if (view) params = params.set('view', view);
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getInboxCounts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/inbox-counts`);
  }

  createProcedure(procedure: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, procedure);
  }

  getProcedureById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateProcedure(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
}
