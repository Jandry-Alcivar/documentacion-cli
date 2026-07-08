import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = 'http://localhost:3001/api/documents';

  constructor(private http: HttpClient) {}

  getDocuments(filters?: any): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.departmentId) params = params.set('departmentId', filters.departmentId);
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getTrash(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/trash`);
  }

  getDocumentById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createDocument(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  createInternalDocument(doc: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/internal`, doc);
  }

  updateDocumentFile(id: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/file`, formData);
  }

  submitDocument(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/submit`, {});
  }

  approveDocument(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectDocument(id: string, notes: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reject`, { notes });
  }

  sendInterdepartmental(id: string, targetDepartmentId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/send-interdept`, { targetDepartmentId });
  }

  assignInterdepartmental(id: string, assigneeId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/assign-interdept`, { assigneeId });
  }

  deleteDocument(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  restoreDocument(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/restore`, {});
  }

  verifyIntegrity(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/verify`, {});
  }
}
