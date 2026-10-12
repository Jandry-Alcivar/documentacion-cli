import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProcedureService {
  private apiUrl = 'http://localhost:3001/api/procedures';

  constructor(private http: HttpClient) {}

  getProcedures(view?: string, search?: string): Observable<any[]> {
    let params = new HttpParams();
    if (view) params = params.set('view', view);
    if (search) params = params.set('search', search);
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getInboxCounts(): Observable<any> {
    const params = new HttpParams().set('_t', Date.now().toString());
    return this.http.get<any>(`${this.apiUrl}/inbox-counts`, { params });
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

  addDocumentToProcedure(procedureId: string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${procedureId}/documents`, formData);
  }

  signDocumentInProcedure(procedureId: string, docId: string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${procedureId}/documents/${docId}/sign`, formData);
  }

  deriveProcedure(procedureId: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${procedureId}/derive`, payload);
  }

  sendProcedureEmail(procedureId: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${procedureId}/send-email`, payload);
  }

  finalizeProcedure(procedureId: string, payload: { conclusion: string; sendEmailToApplicant?: boolean }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${procedureId}/finalize`, payload);
  }

  returnProcedure(procedureId: string, payload: { notes: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${procedureId}/return`, payload);
  }

  revertProcedure(procedureId: string, payload: { reason: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${procedureId}/revert`, payload);
  }

  verifyProcedure(procedureId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${procedureId}/verify`, { params: { _t: Date.now().toString() } });
  }

  getImmutabilityMode(): Observable<{ mode: 'REOPEN' | 'LOCKED' }> {
    return this.http.get<any>(`http://localhost:3001/api/settings/immutability`, { params: { _t: Date.now().toString() } });
  }

  setImmutabilityMode(mode: 'REOPEN' | 'LOCKED'): Observable<any> {
    return this.http.put<any>(`http://localhost:3001/api/settings/immutability`, { mode });
  }

  getPublicProcedureTrack(code: string, applicantId?: string): Observable<any> {
    let params = new HttpParams().set('code', code);
    if (applicantId && applicantId.trim() !== '') {
      params = params.set('applicantId', applicantId.trim());
    }
    return this.http.get<any>(`${this.apiUrl}/public/track`, { params });
  }

  getDossierZipUrl(procedureId: string): string {
    return `${this.apiUrl}/${procedureId}/dossier-zip`;
  }

  downloadDossierZip(procedureId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${procedureId}/dossier-zip`, {
      responseType: 'blob'
    });
  }

  deleteProcedure(procedureId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${procedureId}`);
  }
}
