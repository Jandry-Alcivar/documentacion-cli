import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private apiUrl = 'http://localhost:3001/api/templates';

  constructor(private http: HttpClient) {}

  getTemplates(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createTemplate(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateTemplate(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteTemplate(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
