import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private catalogsUrl = 'http://localhost:3001/api/catalogs';
  private configUrl = 'http://localhost:3001/api/config';

  constructor(private http: HttpClient) {}

  // --- Tipos de Trámite ---
  getProcedureTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.catalogsUrl}/procedure-types`);
  }

  createProcedureType(data: any): Observable<any> {
    return this.http.post<any>(`${this.catalogsUrl}/procedure-types`, data);
  }

  updateProcedureType(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.catalogsUrl}/procedure-types/${id}`, data);
  }

  // --- Tipos de Documento ---
  getDocumentTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.catalogsUrl}/document-types`);
  }

  createDocumentType(data: any): Observable<any> {
    return this.http.post<any>(`${this.catalogsUrl}/document-types`, data);
  }

  updateDocumentType(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.catalogsUrl}/document-types/${id}`, data);
  }

  // --- Extensiones Permitidas ---
  getFileTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.configUrl}/file-types`);
  }

  addFileType(extension: string): Observable<any> {
    return this.http.post<any>(`${this.configUrl}/file-types`, { extension });
  }

  toggleFileType(id: string, isActive: boolean): Observable<any> {
    return this.http.put<any>(`${this.configUrl}/file-types/${id}`, { isActive });
  }

  // --- Reportes de Sistema ---
  getSystemReports(): Observable<any> {
    return this.http.get<any>(`${this.configUrl}/reports`);
  }
}
