import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:3001/api/reports';

  constructor(private http: HttpClient) {}

  private cleanParams(filters: any): Record<string, string> {
    const params: Record<string, string> = {};
    if (!filters) return params;
    for (const key of Object.keys(filters)) {
      const val = filters[key];
      if (val !== undefined && val !== null && val !== '' && val !== 'undefined') {
        params[key] = String(val);
      }
    }
    return params;
  }

  getProceduresReport(filters?: { departmentId?: string; status?: string; startDate?: string; endDate?: string }): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/procedures`, { params: this.cleanParams(filters) });
  }

  getDocumentsReport(filters?: { departmentId?: string; status?: string; typeId?: string; startDate?: string; endDate?: string }): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/documents`, { params: this.cleanParams(filters) });
  }
}
