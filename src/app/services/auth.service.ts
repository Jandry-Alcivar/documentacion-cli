import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
  role: {
    id: string;
    name: string;
    permissions: string; // JSON string
  };
  department: {
    id: string;
    name: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/api/auth';
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getPermissions(): string[] {
    const user = this.currentUser();
    if (!user) return [];
    try {
      return JSON.parse(user.role.permissions);
    } catch (e) {
      return [];
    }
  }

  hasPermission(permission: string): boolean {
    const perms = this.getPermissions();
    return perms.includes('all') || perms.includes(permission);
  }

  isAdmin(): boolean {
    return this.currentUser()?.role?.name === 'Administrador';
  }

  isMayor(): boolean {
    return this.currentUser()?.role?.name === 'Alcalde';
  }

  isLeader(): boolean {
    return this.currentUser()?.role?.name === 'Director Departamental';
  }

  isEmployee(): boolean {
    return this.currentUser()?.role?.name === 'Funcionario';
  }
}
